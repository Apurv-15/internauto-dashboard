import React from 'react';
import { Internship, JobStatus } from '../types';
import { MapPin, DollarSign, Clock, ExternalLink, CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

interface JobCardProps {
  job: Internship;
}

export const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.APPLIED: return 'bg-green-100 text-green-800 border-green-200';
      case JobStatus.FAILED: return 'bg-red-100 text-red-800 border-red-200';
      case JobStatus.APPLYING: return 'bg-blue-100 text-blue-800 border-blue-200';
      case JobStatus.SKIPPED: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
        case JobStatus.APPLIED: return <CheckCircle className="w-4 h-4 mr-1" />;
        case JobStatus.FAILED: return <XCircle className="w-4 h-4 mr-1" />;
        case JobStatus.APPLYING: return <Loader className="w-4 h-4 mr-1 animate-spin" />;
        case JobStatus.SKIPPED: return <AlertCircle className="w-4 h-4 mr-1" />;
        default: return <Clock className="w-4 h-4 mr-1" />;
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{job.title}</h3>
          <p className="text-sm text-gray-600 font-medium">{job.company}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center border ${getStatusColor(job.status)}`}>
          {getStatusIcon(job.status)}
          {job.status}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mt-3">
        <div className="flex items-center">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          {job.location}
        </div>
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
          {job.stipend}
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <span>Posted: {job.posted}</span>
        <a href={job.link} target="_blank" rel="noreferrer" className="flex items-center hover:text-blue-600 transition-colors">
          View <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>
    </div>
  );
};
