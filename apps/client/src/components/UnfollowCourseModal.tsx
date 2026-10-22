import { useState } from 'react';
import { BookX } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/http';
import type { Course } from '../types';
export function UnfollowCourseModal({
  course,
  onUnfollow,
}: {
  course: Course;
  onUnfollow: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await api(`/learning/courses/${course.id}/follow`, { method: 'DELETE' });
      toast.success('Cours retiré de votre programme.');
      setOpen(false);
      onUnfollow();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action impossible.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="square-action danger-action"
        title="Retirer le cours"
        onClick={() => setOpen(true)}
      >
        <BookX size={15} />
      </button>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal-card confirm-card" onClick={(e) => e.stopPropagation()}>
            <span className="course-icon danger-icon">
              <BookX />
            </span>
            <h2>Retirer ce cours ?</h2>
            <p>« {course.title} » ne fera plus partie de votre tableau de bord.</p>
            <div className="modal-actions">
              <button className="button button-quiet" onClick={() => setOpen(false)}>
                Annuler
              </button>
              <button className="button button-danger" disabled={busy} onClick={remove}>
                {busy ? 'Retrait…' : 'Confirmer le retrait'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
