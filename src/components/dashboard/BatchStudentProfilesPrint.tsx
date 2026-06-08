import React, { forwardRef } from 'react';
import type { StudentProfileData } from '../../services/studentProfileService';
import { StudentProfileView } from './StudentProfileView';

export interface BatchStudentProfilesPrintProps {
  profiles: StudentProfileData[];
}

export const BatchStudentProfilesPrint = forwardRef<HTMLDivElement, BatchStudentProfilesPrintProps>(
  ({ profiles }, ref) => {
    if (!profiles || profiles.length === 0) return null;

    return (
      <div ref={ref} className="bg-white text-black">
        {profiles.map((profile, index) => (
          <div
            key={profile.studentId}
            className={`w-full bg-white print:px-2 print:py-2 ${
              index !== profiles.length - 1 ? 'print:break-after-page' : ''
            }`}
          >
            {/* Header for print view */}
            <div className="border-b border-slate-200 px-6 py-8 mb-4">
              <h2 className="text-3xl font-bold text-slate-800">{profile.studentName}</h2>
              <p className="text-lg text-slate-500 mt-1">Grupo {profile.grupo}</p>
            </div>
            
            {/* Body */}
            <StudentProfileView profileData={profile} disableAnimations={true} />
          </div>
        ))}
      </div>
    );
  }
);

BatchStudentProfilesPrint.displayName = 'BatchStudentProfilesPrint';
