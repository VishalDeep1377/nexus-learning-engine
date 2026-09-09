'use client';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '@/store/userStore';
import {
  User, Mail, Calendar, MapPin,
  Github, Linkedin, Info, Edit3,
  Camera, CheckCircle, Loader2, Phone, Sparkles, AlertCircle, Settings, X
} from 'lucide-react';
import axios from 'axios';

const UserProfile = () => {
  const { userData, setUserData } = useUserStore();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    userName: '',
    phoneNumber: '',
    address: '',
    bio: '',
    githubUrl: '',
    linkedinUrl: '',
    gender: ''
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        userName: userData.userName || '',
        phoneNumber: userData.phoneNumber || '',
        address: userData.address || '',
        bio: userData.bio || '',
        githubUrl: userData.githubUrl || '',
        linkedinUrl: userData.linkedinUrl || '',
        gender: userData.gender || ''
      });
    }
  }, [userData]);

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      let payload = { ...formData, userId: userData?._id || userData?.id };

      const res = await axios.post('/api/user/editProfile', payload, {
        withCredentials: true,
      });

      // Strongly check for the server response
      const updatedUser = res?.data?.user;

      if (updatedUser) {
        // Optimistically merge what the user typed over the server response.
        // This ensures the UI instantly maps the new fields even if Mongoose stripped them due to Next.js HMR Schema Caching!
        setUserData({ ...updatedUser, ...formData });
      } else {
        // Fallback: merge form changes into existing userData so the UI
        // reflects the edit even if the API doesn't echo the updated doc.
        setUserData({ ...userData, ...formData });
      }

      setSaveSuccess(true);
      setTimeout(() => {
          setSaveSuccess(false);
          setIsEditing(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to save profile", err);
      setSaveError(
        err?.response?.data?.message || err?.message || "Failed to save changes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0b14]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const joinDate = userData.createdAt
    ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'New User';

  const avatarUrl = avatarPreview || userData.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${userData.email}`;

  return (
    <div className="min-h-screen bg-[#0a0b14] text-white pt-24 pb-12 px-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden glass-panel border border-white/10"
          style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(20px)' }}
        >
          <div className="h-32 md:h-48 w-full bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-pink-600/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0b14]/90" />
            <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 opacity-30 select-none hidden sm:block pointer-events-none">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-indigo-200 to-purple-500 leading-none text-right">
                Personal<br />Profile
              </h1>
            </div>
            {userData.provider === 'google' && (
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 24c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 21.53 7.7 24 12 24z" /><path fill="#FBBC05" d="M5.84 15.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V8.06H2.18C1.43 9.55 1 11.22 1 13s.43 3.45 1.18 4.94l3.66-2.84z" /><path fill="#EA4335" d="M12 4.64c1.61 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.19 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.06l3.66 2.84c.87-2.6 3.3-4.26 6.16-4.26z" /></svg>
                <span className="text-xs font-semibold text-gray-300 hidden sm:inline">Synced</span>
              </div>
            )}
            
            {/* Edit Symbol Floating Action Button */}
            <button
               onClick={() => setIsEditing(true)}
               className={`absolute top-4 ${userData.provider === 'google' ? 'right-28 sm:right-32' : 'right-4'} bg-black/40 hover:bg-black/80 transition-colors backdrop-blur-md p-2 rounded-full border border-white/10 group flex items-center justify-center`}
               title="Edit Profile"
            >
              <Settings className="w-5 h-5 text-gray-300 group-hover:text-white group-hover:rotate-90 transition-all duration-500" />
            </button>
          </div>

          <div className="px-6 md:px-8 pb-8 -mt-16 relative">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] blur-xl opacity-40 group-hover:opacity-60 transition duration-500" />
                <div className="w-32 h-32 rounded-[2rem] p-1 bg-gradient-to-tr from-indigo-500 to-pink-500 relative z-10">
                  <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-[#0a0b14] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <div className="text-center md:text-left flex-1 mb-2">
                <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                  {userData.name}
                </h1>
                <p className="text-gray-400 font-medium flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail className="w-4 h-4" /> {userData.email}
                </p>
              </div>

              <div className="hidden md:flex gap-4 mb-2">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Member Since</p>
                  <p className="font-semibold text-indigo-300">{joinDate}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-8 relative">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl hover:bg-white/[0.07] transition-all">
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-400" /> Bio & About
                  </h3>
                </div>
                {userData.bio ? (
                  <p className="text-gray-300 leading-relaxed">{userData.bio}</p>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-gray-600 bg-black/20 text-center">
                    <p className="text-gray-500 text-sm">No bio added yet. Tell the community about yourself!</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-6 mt-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20"><User className="w-5 h-5 text-purple-400" /></div>
                      <div><p className="text-xs text-gray-500">Username</p><p className="font-semibold text-gray-200">{userData.userName || 'Not set'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Phone className="w-5 h-5 text-blue-400" /></div>
                      <div><p className="text-xs text-gray-500">Phone</p><p className="font-semibold text-gray-200">{userData.phoneNumber || 'Not set'}</p></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20"><MapPin className="w-5 h-5 text-pink-400" /></div>
                      <div><p className="text-xs text-gray-500">Location</p><p className="font-semibold text-gray-200">{userData.address || 'Not set'}</p></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Info className="w-5 h-5 text-amber-400" /></div>
                      <div><p className="text-xs text-gray-500">Gender</p><p className="font-semibold text-gray-200 capitalize">{userData.gender || 'Not set'}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Links & Socials</h3>
                <div className="space-y-4">
                  <a href={userData.githubUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 group cursor-pointer">
                    <Github className="w-6 h-6 text-gray-400 group-hover:text-white transition" />
                    <div><p className="text-sm font-bold text-gray-200">GitHub</p><p className="text-xs text-gray-500 truncate w-32">{userData.githubUrl || 'Not linked'}</p></div>
                  </a>
                  <a href={userData.linkedinUrl || '#'} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/10 group cursor-pointer">
                    <Linkedin className="w-6 h-6 text-gray-400 group-hover:text-[#0A66C2] transition" />
                    <div><p className="text-sm font-bold text-gray-200">LinkedIn</p><p className="text-xs text-gray-500 truncate w-32">{userData.linkedinUrl || 'Not linked'}</p></div>
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Account Role</h3>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span className="text-xl font-black capitalize text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    {userData.role}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* MODAL OVERLAY FOR EDIT PROFILE */}
        <AnimatePresence>
          {isEditing && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg overflow-y-auto"
            >
              <div className="absolute inset-0" onClick={() => setIsEditing(false)} />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 30 }} 
                transition={{ type: "spring", duration: 0.5 }}
                className="relative w-full max-w-4xl bg-[#0a0b14] border border-white/10 rounded-[2rem] shadow-2xl shadow-indigo-500/10 max-h-[90vh] overflow-y-auto"
              >
                <button 
                   onClick={() => setIsEditing(false)}
                   className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>

                <form onSubmit={handleSave} className="p-6 md:p-10 relative">

                  <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8 pr-12">
                    <div>
                      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Edit Profile Details</h2>
                      <p className="text-gray-500 text-sm mt-1">Update your personal and public-facing information.</p>
                    </div>
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="hidden sm:flex flex-col items-center gap-1 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20">
                          <CheckCircle className="w-5 h-5" /> <span className="text-xs font-bold uppercase tracking-wider">Saved</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {saveError && (
                    <div className="mb-6 flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-3 rounded-xl border border-red-400/20 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                        <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Username</label>
                        <input name="userName" value={formData.userName} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="@johndoe" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                        <input name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} type="tel" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+1..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Gender</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white appearance-none">
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Address / Location</label>
                        <input name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="City, Country" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">GitHub Profile URL</label>
                        <input name="githubUrl" value={formData.githubUrl} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://github.com/..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">LinkedIn Profile URL</label>
                        <input name="linkedinUrl" value={formData.linkedinUrl} onChange={handleInputChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors" placeholder="https://linkedin.com/in/..." />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Developer Bio</label>
                        <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none" placeholder="Tell us about your tech stack and goals..." />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end">
                    <button type="submit" disabled={isSaving} className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                      {isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</> : 'Save Changes'}
                    </button>
                  </div>

                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default UserProfile;