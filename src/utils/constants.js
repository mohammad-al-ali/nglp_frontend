export const categories = [
  { id: 1, name: 'Programming', parentId: null },
  { id: 2, name: 'Design', parentId: null },
  { id: 3, name: 'Data Science', parentId: null },
  { id: 4, name: 'Frontend', parentId: 1 },
  { id: 5, name: 'Backend', parentId: 1 },
  { id: 6, name: 'Product Design', parentId: 2 },
];

export const courses = [
  {
    id: 1,
    title: 'React Foundations with AI Tutor',
    categoryId: 4,
    category: 'Frontend',
    level: 'Beginner',
    progress: 72,
    students: 1240,
    lessonsCount: 4,
    description:
      'Build confident React habits through concise lessons, guided examples, and contextual AI help while you study.',
  },
  {
    id: 2,
    title: 'Spring Boot API Builder',
    categoryId: 5,
    category: 'Backend',
    level: 'Intermediate',
    progress: 38,
    students: 840,
    lessonsCount: 3,
    description:
      'Design REST endpoints, model relationships, and connect uploads to long-running services in a practical backend flow.',
  },
  {
    id: 3,
    title: 'UX Systems for Learning Products',
    categoryId: 6,
    category: 'Product Design',
    level: 'All levels',
    progress: 12,
    students: 650,
    lessonsCount: 3,
    description:
      'Create clear navigation, course flows, and study interfaces for focused digital learning experiences.',
  },
  {
    id: 4,
    title: 'Python Data Workflows',
    categoryId: 3,
    category: 'Data Science',
    level: 'Beginner',
    progress: 0,
    students: 970,
    lessonsCount: 3,
    description:
      'Learn practical notebooks, data cleaning, and explanation-first analysis with tutor prompts at each step.',
  },
];

export const lessonsByCourse = {
  1: [
    {
      id: 101,
      title: 'React mental model',
      duration: '09:42',
      description: 'Understand components, props, state, and how React updates UI predictably.',
      transcript:
        'React applications are built as a tree of components. Each component receives inputs and returns interface. State changes tell React which part of the tree needs a fresh render.',
      videoUrl: '',
    },
    {
      id: 102,
      title: 'State and events',
      duration: '12:10',
      description: 'Practice controlled state, event handlers, and simple interactive widgets.',
      transcript:
        'Events carry user intent into your component. State stores the current answer your interface should show.',
      videoUrl: '',
    },
    {
      id: 103,
      title: 'Routing pages',
      duration: '10:28',
      description: 'Use routes, links, and URL parameters to shape a multi-screen learning app.',
      transcript:
        'A route maps a URL to a component. Parameters let one component serve many records, such as course details by id.',
      videoUrl: '',
    },
    {
      id: 104,
      title: 'Calling APIs',
      duration: '14:34',
      description: 'Fetch backend data, handle loading states, and keep the UI useful when requests fail.',
      transcript:
        'API calls should have a loading path, a success path, and a recovery path. This keeps the learning flow steady.',
      videoUrl: '',
    },
  ],
  2: [
    {
      id: 201,
      title: 'Controller design',
      duration: '11:22',
      description: 'Create resource controllers and readable endpoint contracts.',
      transcript: 'Controllers describe the public surface of an API. Keep routes consistent and responses predictable.',
      videoUrl: '',
    },
    {
      id: 202,
      title: 'Multipart lessons',
      duration: '13:18',
      description: 'Upload lesson metadata and video files in a single multipart request.',
      transcript: 'Multipart upload lets a client send structured JSON and a binary file together in one request.',
      videoUrl: '',
    },
    {
      id: 203,
      title: 'Async transcripts',
      duration: '08:55',
      description: 'Let video processing continue after the upload succeeds.',
      transcript: 'Long-running transcription work should happen outside the request path so users can keep working.',
      videoUrl: '',
    },
  ],
  3: [
    {
      id: 301,
      title: 'Learning journeys',
      duration: '10:10',
      description: 'Map user goals to course, lesson, and study room navigation.',
      transcript: 'Good learning products make the next useful action obvious without crowding the page.',
      videoUrl: '',
    },
    {
      id: 302,
      title: 'Study interface patterns',
      duration: '12:47',
      description: 'Balance video, notes, lesson context, and AI support in a focused workspace.',
      transcript: 'The study room should privilege learning content while keeping support controls close at hand.',
      videoUrl: '',
    },
    {
      id: 303,
      title: 'Progress feedback',
      duration: '07:51',
      description: 'Use progress bars and status text to orient learners.',
      transcript: 'Progress feedback works best when it tells the learner where they are and what can happen next.',
      videoUrl: '',
    },
  ],
  4: [
    {
      id: 401,
      title: 'Notebook setup',
      duration: '08:35',
      description: 'Prepare a lightweight data workspace and load the first dataset.',
      transcript: 'A reproducible notebook starts with clear imports, a known dataset, and small verifiable steps.',
      videoUrl: '',
    },
    {
      id: 402,
      title: 'Clean and inspect',
      duration: '13:05',
      description: 'Find missing values, normalize columns, and keep transformations explainable.',
      transcript: 'Inspection turns raw data into a set of concrete questions. Cleaning makes those questions answerable.',
      videoUrl: '',
    },
    {
      id: 403,
      title: 'Explain the result',
      duration: '09:14',
      description: 'Turn outputs into concise findings supported by the data.',
      transcript: 'A useful analysis connects a result to a decision. The best chart is the one that clarifies that link.',
      videoUrl: '',
    },
  ],
};

export const enrolledCourseIds = [1, 2, 3];

export function categoryMatches(course, selectedCategoryId, categoryList = categories) {
  if (selectedCategoryId === 'all') return true;
  const targetId = Number(selectedCategoryId);
  const courseCategory = categoryList.find((category) => category.id === course.categoryId);
  return course.categoryId === targetId || courseCategory?.parentId === targetId;
}

export function normalizeCategory(category, parentId = null) {
  return {
    id: category.id,
    name: category.name,
    parentId,
  };
}

export function normalizeCourse(course) {
  return {
    id: course.id,
    title: course.title || 'كورس غير معنون',
    categoryId: course.category?.id || null,
    category: course.category?.name || 'تصنيف عام',
    level: course.level || 'جميع المستويات',
    progress: course.progressPercentage || course.progress || 0,
    students: course.studentsCount || (course.students ? (typeof course.students === 'number' ? course.students : course.students.length) : 0),
    lessonsCount: course.lessonsCount || course.lessons?.length || 0,
    description: course.description || 'لا يوجد وصف تفصيلي متوفر حالياً لهذا الكورس.',
  };
}

export function normalizeLesson(lesson) {
  return {
    id: lesson.id,
    title: lesson.title || 'درس غير معنون',
    duration: lesson.durationSeconds ? formatDuration(lesson.durationSeconds) : '00:00',
    durationSeconds: lesson.durationSeconds || 0,
    description: lesson.description || 'تفاصيل الدرس التعليمي ستظهر هنا قريباً.',
    transcript: lesson.transcript || 'التفريغ النصي للفيديو سيظهر هنا بعد انتهاء عملية المعالجة.',
    videoUrl: lesson.videoUrl || '',
  };
}

export function normalizeEnrollment(enrollment) {
  const course = normalizeCourse(enrollment.course || {});
  return {
    id: enrollment.id,
    course,
    progress: enrollment.progressPercentage || enrollment.progress || 0,
    lastWatchedLesson: enrollment.lastWatchedLesson ? normalizeLesson(enrollment.lastWatchedLesson) : null,
  };
}

export function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function resolveMediaUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  
  // Use either specified URL or standard base prefix
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  const cleanBase = envUrl.replace('/api/v1', '');
  const relativePath = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${relativePath}`;
}
