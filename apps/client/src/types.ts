export interface User { id: number; email: string; name: string | null; hasOnboarded: boolean; optionId: number | null; levelId: number | string | null; interests?: string[] | null }
export interface Option { id: number; name: string; slug: string; sectorId?: number | null }
export interface Level { id: number; name: string; order?: number | null }
export interface Chapter { id: number; title: string; description?: string | null; content: string | Record<string, any>; order?: number | null; courseId: number; isCompleted?: boolean }
export interface Course { id: number; title: string; description?: string | null; optionId: number | null; levelId: number | null; option?: Option & { sector?: { name: string } | null } | null; level?: Level | null; chapters: Chapter[] }
export interface DashboardData { user: User; option: Option | null; courses: Course[]; answers: { isCorrect: boolean }[]; progress: { chapterId: number; isCompleted: boolean }[] }
export interface StudyTask { id: number; userId: number; chapterId: number | null; title: string; notes: string | null; scheduledAt: string; durationMinutes: number; status: 'planned' | 'completed' | 'cancelled'; completedAt: string | null; chapterTitle?: string | null; courseTitle?: string | null }
export interface RevisionCard { id: number; dueAt: string; intervalMinutes: number; repetitions: number; lapses: number; lastReviewedAt: string | null; chapter: Chapter; course: Course }
export interface RevisionData { now: string; cards: RevisionCard[]; available: { chapterId: number; chapterTitle: string; courseId: number; courseTitle: string }[] }
export interface RevisionReview { id: number; rating: 'again' | 'hard' | 'good' | 'easy'; intervalBeforeMinutes: number; intervalAfterMinutes: number; reviewedAt: string; chapterTitle: string; courseTitle: string }
export interface ExamQuestion { id: number; position: number; prompt: string; options: string[]; selectedAnswer: string | null; correctAnswer?: string; explanation?: string | null; isCorrect?: boolean }
export interface Exam { id: number; title: string; status: 'in_progress' | 'completed' | 'abandoned'; questionCount: number; correctCount: number; scorePercent: number | null; timeLimitMinutes: number | null; startedAt: string; finishedAt: string | null; questions?: ExamQuestion[] }
export interface AssistantConversation { id: number; chapterId: number | null; title: string; createdAt: string; updatedAt: string }
export interface AssistantMessage { id: number; role: 'user' | 'assistant'; content: string; createdAt: string }
