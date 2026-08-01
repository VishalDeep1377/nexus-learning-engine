declare module 'linkedin-jobs-api' {
  interface QueryOptions {
    keyword?: string | null;
    location?: string | null;
    dateSincePosted?: string;
    jobType?: string;
    remoteFilter?: string;
    salary?: string;
    experienceLevel?: string | null;
    limit?: string;
    page?: string;
  }

  interface LinkedIn {
    query: (options: QueryOptions) => Promise<any>;
  }

  const LinkedIn: LinkedIn;
  export default LinkedIn;
} 