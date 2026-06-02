'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Star,
  FileText,
  Link as LinkIcon,
  BookOpen,
  Sparkles,
  XCircle,
  AlertCircle,
  User,
  Award,
  MessageSquare,
  ExternalLink,
  Loader2,
  Send,
  AlertTriangle,
  Pencil,
  ArrowLeft,
} from 'lucide-react';
import { useMentorTaskDetail } from '@/lib/hooks/mentor';
import { PageHeader, StatusBadge } from '@/components/admin/ui';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function MentorTaskDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    task,
    loading,
    error,
    cancellingTask,
    cancelReason,
    isCancelling,
    extensionDecision,
    newDueDate,
    isHandlingExtension,
    setCancellingTask,
    setCancelReason,
    setExtensionDecision,
    setNewDueDate,
    handleExtension,
    handleCancelTask,
    handleUpdateCustomTask,
    isUpdating,
  } = useMentorTaskDetail(resolvedParams.id);

  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    type: 'custom',
    difficulty: 'medium',
    dueDate: '',
    pointsBase: 10,
    deliverable: '',
    acceptanceCriteriaText: '',
  });

  const startEditing = () => {
    if (!task) return;
    const roadmapTask = task.roadmapTask || {};
    setEditFormData({
      title: roadmapTask.title || task.title || '',
      description: roadmapTask.description || task.description || '',
      type: roadmapTask.type || task.type || 'custom',
      difficulty: roadmapTask.difficulty || task.difficulty || 'medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      pointsBase: roadmapTask.pointsBase || 10,
      deliverable: roadmapTask.deliverable || '',
      acceptanceCriteriaText: (roadmapTask.acceptanceCriteria || []).join('\n'),
    });
    setIsEditing(true);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleUpdateCustomTask({
        title: editFormData.title,
        description: editFormData.description,
        type: editFormData.type,
        difficulty: editFormData.difficulty,
        dueDate: editFormData.dueDate || undefined,
        pointsBase: editFormData.pointsBase,
        deliverable: editFormData.deliverable,
        acceptanceCriteria: editFormData.acceptanceCriteriaText
          .split('\n')
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
      });
      setIsEditing(false);
    } catch {
      // toast shown by hook
    }
  };

  const [isEditable, setIsEditable] = useState(false);

  useEffect(() => {
    let active = true;
    if (task && task.isCustomTask && ['assigned', 'in_progress'].includes(task.status)) {
      const assignedTime = new Date(task.assignedAt).getTime();
      const timeRemaining = 15 * 60 * 1000 - (Date.now() - assignedTime);

      Promise.resolve().then(() => {
        if (active) setIsEditable(timeRemaining > 0);
      });

      if (timeRemaining > 0) {
        const timer = setTimeout(() => {
          if (active) setIsEditable(false);
        }, timeRemaining);
        return () => {
          active = false;
          clearTimeout(timer);
        };
      }
    } else {
      Promise.resolve().then(() => {
        if (active) setIsEditable(false);
      });
    }
    return () => {
      active = false;
    };
  }, [task]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
        <p className="text-red-900">{error || 'Task not found'}</p>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="mb-4">
          <button
            onClick={() => setIsEditing(false)}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm mb-3 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancel Editing
          </button>
        </div>
        
        <form onSubmit={saveEdit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Edit Custom Task</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1">
                Task Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Task Type</label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="custom">Custom</option>
                  <option value="exercise">Extra Practice</option>
                  <option value="project">Project</option>
                  <option value="practical">Practical</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Difficulty</label>
                <select
                  value={editFormData.difficulty}
                  onChange={(e) => setEditFormData({ ...editFormData, difficulty: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={editFormData.dueDate}
                  onChange={(e) => setEditFormData({ ...editFormData, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-medium mb-1">Points</label>
                <input
                  type="number"
                  value={editFormData.pointsBase}
                  onChange={(e) => setEditFormData({ ...editFormData, pointsBase: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1">Deliverable</label>
              <input
                type="text"
                value={editFormData.deliverable}
                onChange={(e) => setEditFormData({ ...editFormData, deliverable: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1">
                Acceptance Criteria <span className="text-slate-500 text-xs">(one per line)</span>
              </label>
              <textarea
                rows={4}
                value={editFormData.acceptanceCriteriaText}
                onChange={(e) => setEditFormData({ ...editFormData, acceptanceCriteriaText: e.target.value })}
                placeholder="e.g. Code builds without errors&#10;Includes unit tests"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  const taskTitle = task.roadmapTask?.title || task.title || 'Untitled Task';
  const taskDescription = task.roadmapTask?.description || task.description || '';
  const taskDeliverable = task.roadmapTask?.deliverable || task.deliverable;
  const acceptanceCriteria = task.roadmapTask?.acceptanceCriteria || task.acceptanceCriteria || [];
  const resources = task.roadmapTask?.resources || [];
  const latestSubmission = task.submissions?.[task.submissions.length - 1] || null;
  const feedback = latestSubmission?.feedback || [];

  const canReview = ['submitted', 'revision_needed'].includes(task.status);
  const canCancel = !['completed', 'cancelled'].includes(task.status);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <PageHeader backHref="/mentor/tasks" backLabel="Back to Tasks" />

      {/* Task Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h1 className="text-2xl text-slate-900">{taskTitle}</h1>
              {task.isCustomTask ? (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Custom
                </span>
              ) : (
                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> Roadmap
                </span>
              )}
            </div>
            <p className="text-slate-600">{taskDescription}</p>
          </div>
              <StatusBadge status={task.status} />
        </div>

        {/* Mentee info */}
        {task.mentee && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <User className="w-5 h-5 text-slate-400" />
            <div>
              <p className="text-sm font-medium text-slate-900">
                {task.mentee.firstName} {task.mentee.lastName}
              </p>
              <p className="text-xs text-slate-500">
                {task.enrollment?.program?.name}
                {task.enrollment?.currentLevel?.name && ` · ${task.enrollment.currentLevel.name}`}
              </p>
            </div>
          </div>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {task.dueDate && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Due Date</p>
              <p className="text-sm text-slate-900 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(task.dueDate).toLocaleDateString()}
              </p>
            </div>
          )}
          {task.assignedAt && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Assigned</p>
              <p className="text-sm text-slate-900 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                {new Date(task.assignedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {task.completedAt && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Completed</p>
              <p className="text-sm text-slate-900 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {new Date(task.completedAt).toLocaleDateString()}
              </p>
            </div>
          )}
          {task.roadmapTask?.estimatedHours && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Estimated</p>
              <p className="text-sm text-slate-900 flex items-center gap-1">
                <Clock className="w-4 h-4 text-slate-400" />
                {task.roadmapTask.estimatedHours}h
              </p>
            </div>
          )}
        </div>

        {/* Rating & Points */}
        {task.status === 'completed' && (task.finalRating || task.pointsAwarded != null) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6">
            {task.finalRating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= parseFloat(task.finalRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-slate-600">{parseFloat(task.finalRating).toFixed(1)} / 5</span>
              </div>
            )}
            {task.pointsAwarded != null && (
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-700">{task.pointsAwarded} points awarded</span>
              </div>
            )}
          </div>
        )}

        {/* Cancellation reason */}
        {task.status === 'cancelled' && task.cancellationReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Task Cancelled</p>
              <p className="text-sm text-red-700 mt-1">{task.cancellationReason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Task Requirements */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">Task Requirements</h2>

        {taskDeliverable && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Deliverable</p>
            <p className="text-sm text-blue-800">{taskDeliverable}</p>
          </div>
        )}

        {acceptanceCriteria.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Acceptance Criteria</h3>
            <ul className="space-y-2">
              {acceptanceCriteria.map((criterion: string, index: number) => (
                <li key={index} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm">{criterion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {resources.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Learning Resources</h3>
            <ul className="space-y-2">
              {resources.map((resource: any) => (
                <li key={resource.id}>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {resource.title}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Submission */}
      {task.submissions && task.submissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Mentee Submission
            {task.submissions.length > 1 && (
              <span className="text-xs text-slate-500 font-normal ml-1">(v{latestSubmission?.version})</span>
            )}
          </h2>

          {latestSubmission && (
            <div className="space-y-4">
              {latestSubmission.status && (
                <StatusBadge status={latestSubmission.status} />
              )}

              {latestSubmission.submissionText && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Submission Description</p>
                  <div
                    className="prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: latestSubmission.submissionText }}
                  />
                </div>
              )}

              {latestSubmission.submissionUrls && latestSubmission.submissionUrls.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Project Links</p>
                  <ul className="space-y-1.5">
                    {latestSubmission.submissionUrls.map((url: string, i: number) => (
                      <li key={i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:underline flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted on {new Date(latestSubmission.submittedAt).toLocaleString()}
                {latestSubmission.reviewedAt && (
                  <> · Reviewed on {new Date(latestSubmission.reviewedAt).toLocaleString()}</>
                )}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Feedback given */}
      {feedback.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-500" />
            Feedback Given
          </h2>
          {feedback.map((fb: any, index: number) => (
            <div key={fb.id || index} className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-900">
                  {fb.action === 'approve' || fb.action === 'approved' ? 'Approved' : fb.action === 'request_revision' ? 'Revision Requested' : 'Reviewed'}
                </p>
                {fb.rating != null && (
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= fb.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              {fb.comments && (
                <p className="text-sm text-indigo-800">{fb.comments}</p>
              )}
              {fb.strengths && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">Strengths</p>
                  <p className="text-sm text-green-800">{fb.strengths}</p>
                </div>
              )}
              {fb.improvements && (
                <div>
                  <p className="text-xs font-medium text-orange-700 mb-1">Areas for Improvement</p>
                  <p className="text-sm text-orange-800">{fb.improvements}</p>
                </div>
              )}
              {fb.createdAt && (
                <p className="text-xs text-slate-400">{new Date(fb.createdAt).toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Extension Request ── */}
      {(() => {
        const pendingExtension = task.submissions?.find(
          (s: any) => s.extensionRequested && s.extensionStatus === 'pending'
        );
        if (!pendingExtension) return null;
        return (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-orange-900 mb-1">Extension Request Pending</h2>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-orange-700 font-medium">Days Requested</p>
                    <p className="text-orange-900">{pendingExtension.extensionDays} day{pendingExtension.extensionDays !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-orange-700 font-medium">Reason</p>
                    <p className="text-orange-900">{pendingExtension.extensionReason || '—'}</p>
                  </div>
                  <div>
                    <p className="text-orange-700 font-medium">Current Due Date</p>
                    <p className="text-orange-900">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</p>
                  </div>
                  {task.dueDate && pendingExtension.extensionDays && (
                    <div>
                      <p className="text-orange-700 font-medium">New Due Date if Approved</p>
                      <p className="text-orange-900">
                        {new Date(
                          new Date(task.dueDate).getTime() + pendingExtension.extensionDays * 86400000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Decision UI */}
            {extensionDecision === null && (
              <div className="flex gap-3 pt-2 border-t border-orange-200">
                <button
                  onClick={() => setExtensionDecision('approve')}
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Extension
                </button>
                <button
                  onClick={() => setExtensionDecision('reject')}
                  className="px-5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Extension
                </button>
              </div>
            )}

            {extensionDecision === 'approve' && (
              <div className="pt-2 border-t border-orange-200 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-orange-800 mb-1">
                    Override new due date <span className="text-orange-500 font-normal">(optional — leave blank to use +{pendingExtension.extensionDays} days)</span>
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="px-3 py-2 border border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExtension(true, pendingExtension.id)}
                    disabled={isHandlingExtension}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isHandlingExtension ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Approving...</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Confirm Approve</>
                    )}
                  </button>
                  <button
                    onClick={() => setExtensionDecision(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-white transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {extensionDecision === 'reject' && (
              <div className="pt-2 border-t border-orange-200 space-y-3">
                <p className="text-sm text-orange-800">Are you sure you want to reject this extension request? The mentee will keep the original due date.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExtension(false, pendingExtension.id)}
                    disabled={isHandlingExtension}
                    className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isHandlingExtension ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Rejecting...</>
                    ) : (
                      <><XCircle className="w-4 h-4" /> Confirm Reject</>
                    )}
                  </button>
                  <button
                    onClick={() => setExtensionDecision(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm hover:bg-white transition-colors"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {canCancel && !cancellingTask && (
            <button
              onClick={() => setCancellingTask(true)}
              className="px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl border border-red-200 font-medium transition-colors text-sm"
            >
              Cancel Task
            </button>
          )}

          {isEditable && !cancellingTask && (
            <button
              onClick={startEditing}
              className="px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 font-medium transition-colors text-sm flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit Task
            </button>
          )}
        </div>

        {canReview && !cancellingTask && (
          <button
            onClick={() => router.push(`/mentor/tasks/${task.id}/feedback`)}
            className="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Review Submission
          </button>
        )}
      </div>

      {/* Cancel confirmation */}
      {cancellingTask && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-900 font-medium mb-1">Cancel this task?</p>
              <p className="text-red-700 text-sm">This will mark the task as cancelled. The mentee will be notified.</p>
            </div>
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Provide a reason for cancellation..."
            className="w-full p-3 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-3 text-sm"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
            </button>
            <button
              onClick={() => { setCancellingTask(false); setCancelReason(''); }}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg transition-colors border border-slate-200 text-sm"
            >
              Keep Task
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
