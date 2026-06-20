import { useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { useEnsembles } from '../director/hooks/useEnsembles';
import { useStudents } from '../director/hooks/useStudents';
import { useEvents } from '../director/hooks/useEvents';
import { useRosterOverrides } from '../director/hooks/useRosterOverrides';
import { useAnnouncements, visibleAnnouncements } from '../director/hooks/useAnnouncements';
import { useRepertoire } from '../director/hooks/useRepertoire';
import { studentExpectation } from '../director/rosterResolver';
import { todayStr, parseDate, ensembleColor } from '../director/utils';
import { PubEventCard } from './components/PubEventCard';
import { PubAnnouncements } from './components/PubAnnouncements';

export function PublicSchedule() {
  const { id = '' } = useParams();
  const { ensembles } = useEnsembles();
  const { students } = useStudents();
  const { events } = useEvents();
  const { overrides } = useRosterOverrides();
  const { announcements } = useAnnouncements();
  const { pieces } = useRepertoire();

  const student = students.find(s => s.id === id);
  const today = todayStr();
  const ensembleMap = useMemo(() => Object.fromEntries(ensembles.map(e => [e.id, e])), [ensembles]);
  const eventsById = useMemo(() => Object.fromEntries(events.map(e => [e.id, e])), [events]);

  // Upcoming events where this student is expected (base member or sub, minus pulls).
  const mySchedule = useMemo(() => {
    if (!student) return [];
    return events
      .filter(e => e.date >= today)
      .map(e => ({ event: e, exp: studentExpectation(id, e, students, overrides, eventsById) }))
      .filter(x => x.exp.expected)
      .sort((a, b) => a.event.date.localeCompare(b.event.date) || (a.event.startTime ?? '99').localeCompare(b.event.startTime ?? '99'));
  }, [student, events, students, overrides, eventsById, id, today]);

  const todayItems = mySchedule.filter(x => x.event.date === today);
  const upcomingItems = mySchedule.filter(x => x.event.date > today);

  const myAnnouncements = useMemo(
    () => student ? visibleAnnouncements(announcements, today, student.ensembleIds ?? []) : [],
    [announcements, today, student],
  );

  // Pieces linked to upcoming events that have a part matching this student's instrument.
  const myParts = useMemo(() => {
    if (!student) return [];
    const upcomingEventIds = new Set(mySchedule.map(x => x.event.id));
    const instrument = student.instrument.toLowerCase();
    const result: { piece: typeof pieces[0]; partUrl: string; eventTitles: string[] }[] = [];
    for (const p of pieces) {
      const partLink = (p.partsLinks ?? []).find(l =>
        l.instrument.toLowerCase().includes(instrument) ||
        instrument.includes(l.instrument.toLowerCase()),
      );
      if (!partLink) continue;
      const linkedEventIds = (p.eventIds ?? []).filter(eid => upcomingEventIds.has(eid));
      if (linkedEventIds.length === 0) continue;
      const eventTitles = linkedEventIds
        .map(eid => eventsById[eid])
        .filter(Boolean)
        .map(e => e.title || e.type);
      result.push({ piece: p, partUrl: partLink.url, eventTitles });
    }
    return result;
  }, [student, mySchedule, pieces, eventsById]);

  if (!student) {
    return (
      <div className="pub-page">
        <Link to="/lookup" className="pub-back"><ChevronLeft size={16} /> Search</Link>
        <div className="pub-card pub-muted">Student not found.</div>
      </div>
    );
  }

  const homeEnsembles = ensembles.filter(e => student.ensembleIds?.includes(e.id));

  return (
    <div className="pub-page">
      <Link to="/lookup" className="pub-back"><ChevronLeft size={16} /> Search</Link>

      <div className="pub-ens-hero">
        <h1 className="pub-h1">{student.name}</h1>
        <div className="pub-muted">{student.instrument}{student.grade ? ` · ${student.grade}` : ''}</div>
        {homeEnsembles.length > 0 && (
          <div className="pub-tag-row">
            {homeEnsembles.map(e => (
              <Link key={e.id} to={`/ensemble/${e.id}`} className="pub-ens-tag" style={{ background: ensembleColor(e) }}>{e.name}</Link>
            ))}
          </div>
        )}
      </div>

      <PubAnnouncements items={myAnnouncements} ensembleMap={ensembleMap} />

      <h2 className="pub-section-title">
        Today · {parseDate(today).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
      </h2>
      {todayItems.length === 0 ? (
        <div className="pub-card pub-muted">Nothing scheduled for you today.</div>
      ) : (
        todayItems.map(({ event: e, exp }) => (
          <PubEventCard key={e.id} event={e} ensembleMap={ensembleMap} ensembleIds={exp.ensembleIds} isSub={exp.isSub} showNotes />
        ))
      )}

      <h2 className="pub-section-title">Coming up</h2>
      {upcomingItems.length === 0 ? (
        <div className="pub-muted">No upcoming rehearsals or events.</div>
      ) : (
        upcomingItems.map(({ event: e, exp }) => (
          <PubEventCard key={e.id} event={e} ensembleMap={ensembleMap} ensembleIds={exp.ensembleIds} isSub={exp.isSub} showDate showNotes />
        ))
      )}

      {myParts.length > 0 && (
        <>
          <h2 className="pub-section-title">Your parts</h2>
          <div className="pub-card">
            {myParts.map(({ piece, partUrl, eventTitles }) => (
              <div key={piece.id} className="pub-mypart-row">
                <div className="pub-mypart-info">
                  <Link to={`/piece/${piece.id}`} className="pub-mypart-title">{piece.title}</Link>
                  {eventTitles.length > 0 && (
                    <div className="pub-mypart-events">{eventTitles.join(', ')}</div>
                  )}
                </div>
                <a className="pub-mypart-btn" href={partUrl} target="_blank" rel="noreferrer">
                  Part <ExternalLink size={12} />
                </a>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
