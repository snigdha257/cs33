import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Bell, BellOff, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users } from '../services/api';
import toast from 'react-hot-toast';

const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-ring-2 focus-ring-[var(--primary)] focus-ring-offset-[var(--ring-offset-bg)] ${
      checked ? 'bg-[var(--primary)]' : 'bg-[var(--surface)]'
    }`}
  >
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
      checked ? 'translate-x-5' : 'translate-x-0'
    }`} />
  </button>
);

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', bio: '', avatar: '' });
  const [notifyOnAnswer,  setNotifyOnAnswer]  = useState(true);
  const [notifyOnComment, setNotifyOnComment] = useState(true);
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name || '', bio: user.bio || '', avatar: user.avatar || '' });
    setNotifyOnAnswer(!!user.notifyOnAnswer);
    setNotifyOnComment(!!user.notifyOnComment);
  }, [user]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error('Name must be at least 2 characters'); return;
    }

    setSubmitting(true);
    try {
      const res = await users.updateProfile(user.id, {
        name: form.name.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim(),
        notifyOnAnswer,
        notifyOnComment,
      });
      updateUser(res.data.data);
      toast.success('Profile updated!');
      navigate(`/profile/${user.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Update failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const current = e.target.current.value;
    const newPw   = e.target.newPw.value;
    const confirm = e.target.confirm.value;
    if (!current) { toast.error('Enter your current password'); return; }
    if (newPw.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    if (newPw !== confirm) { toast.error('New passwords do not match'); return; }

    setPwSubmitting(true);
    try {
      await users.changePassword(user.id, { currentPassword: current, newPassword: newPw });
      toast.success('Password changed successfully!');
      e.target.current.value = '';
      e.target.newPw.value   = '';
      e.target.confirm.value = '';
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Could not change password';
      toast.error(msg);
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface)] py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">

        {/* Header */}
        <h1 className="text-2xl font-bold text-[var(--text-h)]">Edit Profile</h1>

        <form onSubmit={handleSubmit} noValidate className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6 space-y-6">

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-[var(--text)] mb-1.5">Display Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              minLength={2} maxLength={50}
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-h)]"
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-[var(--text)]">Bio</label>
              <span className="text-xs text-[var(--text-muted)]">{form.bio.length}/300</span>
            </div>
            <textarea
              value={form.bio}
              onChange={(e) => set('bio', e.target.value)}
              rows={3} maxLength={300}
              placeholder="Tell the community about yourself..."
              className="w-full border border-[var(--border)] rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none text-[var(--text-h)]"
            />
          </div>

          {/* Notification preferences */}
          <div className="border-t border-[var(--border)] pt-5">
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4 flex items-center gap-2">
              <Bell size={15} /> Notification Preferences
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Notify on new answers</p>
                  <p className="text-xs text-[var(--text-muted)]">Get notified when someone answers your questions</p>
                </div>
                <Toggle checked={notifyOnAnswer} onChange={setNotifyOnAnswer} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Notify on comments</p>
                  <p className="text-xs text-[var(--text-muted)]">Get notified on comments for your content</p>
                </div>
                <Toggle checked={notifyOnComment} onChange={setNotifyOnComment} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-[var(--surface)] text-[var(--text-muted)] font-semibold rounded-lg hover:bg-[var(--surface)] transition-colors">
              Cancel
            </button>
          </div>
        </form>

        {/* Change password — uses uncontrolled inputs to avoid state-reset issue */}
        <form onSubmit={handlePasswordChange} noValidate
          className="bg-[var(--card-bg)] rounded-2xl border border-[var(--border)] p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Lock size={15} /> Change Password
          </h3>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Current Password</label>
            <div className="relative">
              <input
                name="current"
                type={showPw.current ? 'text' : 'password'}
                defaultValue=""
                className="w-full border border-[var(--border)] rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-h)]"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw((s) => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)]">
                {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">New Password</label>
            <div className="relative">
              <input
                name="newPw"
                type={showPw.newPw ? 'text' : 'password'}
                defaultValue=""
                className="w-full border border-[var(--border)] rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-h)]"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw((s) => ({ ...s, newPw: !s.newPw }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)]">
                {showPw.newPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Confirm New Password</label>
            <div className="relative">
              <input
                name="confirm"
                type={showPw.confirm ? 'text' : 'password'}
                defaultValue=""
                className="w-full border border-[var(--border)] rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-[var(--text-h)]"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-muted)]">
                {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={pwSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm border border-[var(--border)] text-[var(--text-muted)] font-medium rounded-lg hover:bg-[var(--surface)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {pwSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Lock size={13} />}
              {pwSubmitting ? 'Saving...' : 'Update Password'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default EditProfilePage;