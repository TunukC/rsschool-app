import { shuffleRec } from './shuffle';

export type CrossMentor = { id: number; githubId: string; students: { id: number; githubId: string }[] | null };

export class CrossMentorDistributionService {
  constructor(private defaultMaxStudents = 1) {}

  public distribute(
    mentors: CrossMentor[],
    existingPairs: { studentId: number; mentorId: number }[],
    registeredStudents?: { id: number; githubId: string }[],
  ) {
    let students = mentors
      .map(m => m.students ?? [])
      .reduce((acc, v) => acc.concat(v), [] as { id: number; githubId: string }[])
      .filter(v => !existingPairs.find(p => p.studentId === v.id))
      .filter(v => registeredStudents?.find(s => s.id === v.id) ?? true);

    const maxStudentsPerMentor = mentors.map(({ id, students }) => {
      const assignedCount = existingPairs.filter(p => p.mentorId === id).length;
      const maxStudentsCount = Math.max((students?.length ?? 0) - assignedCount, 0);
      return { id, maxStudents: maxStudentsCount };
    });

    const maxStudentsTotal = maxStudentsPerMentor.reduce((acc, m) => acc + m.maxStudents, 0);

    if (students.length < maxStudentsTotal && registeredStudents) {
      students = students.concat(
        registeredStudents
          .filter(({ id }) => !existingPairs.find(p => p.studentId === id) && !students.find(st => st.id === id))
          .slice(0, maxStudentsTotal - students.length)
          .map(record => record),
      );
    }

    const randomStudents = shuffleRec(students);

    for (const mentor of mentors) {
      const { maxStudents } = maxStudentsPerMentor.find(str => str.id === mentor.id) ?? {
        maxStudents: this.defaultMaxStudents,
      };
      const students = randomStudents.splice(0, maxStudents);
      mentor.students = students;
    }

    return {
      mentors: mentors as CrossMentor[],
      unassignedStudents: randomStudents,
    };
  }
}
