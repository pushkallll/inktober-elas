import { Submission } from "@/lib/types";

export const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: "sub-1",
    userId: "user-1",
    penName: "midnightink",
    anonymous: false,
    day: 7,
    prompt: "Shadow",
    title: "The Last Light",
    type: "ART",
    status: "APPROVED",
    fileUrl: "https://picsum.photos/seed/shadow/800/1000",
    yuppsiesCount: 42,
    createdAt: "2026-10-07T10:00:00Z"
  },
  {
    id: "sub-2",
    userId: "user-2",
    penName: "poet_laureate",
    anonymous: true,
    day: 7,
    prompt: "Shadow",
    title: "The Last Train",
    type: "WRITING",
    genre: "Poetry",
    status: "APPROVED",
    content: "The iron wheels scream against the frost,\nA memory of summer completely lost.\nShadows stretch across the empty car,\nAs we journey onward, near and far.\nI trace your name upon the glass,\nWatching the silent silhouettes pass.",
    yuppsiesCount: 18,
    createdAt: "2026-10-07T11:30:00Z"
  },
  {
    id: "sub-3",
    userId: "user-3",
    penName: "inkwell",
    anonymous: false,
    day: 6,
    prompt: "Echo",
    title: "Echoes in the Canyon",
    type: "ART",
    status: "APPROVED",
    fileUrl: "https://picsum.photos/seed/echoes/800/600",
    yuppsiesCount: 120,
    createdAt: "2026-10-06T14:20:00Z"
  },
  {
    id: "sub-4",
    userId: "user-1",
    penName: "midnightink",
    anonymous: false,
    day: 6,
    prompt: "Echo",
    title: "A Voice Returning",
    type: "WRITING",
    genre: "Prose",
    status: "APPROVED",
    content: "I shouted into the void, expecting nothing. What came back was not my own voice, but a chorus of every word I had ever left unspoken.",
    yuppsiesCount: 55,
    createdAt: "2026-10-06T09:15:00Z"
  },
  {
    id: "sub-5",
    userId: "user-4",
    penName: "sketcher99",
    anonymous: false,
    day: 5,
    prompt: "Map",
    title: "Lost Navigator",
    type: "ART",
    status: "APPROVED",
    fileUrl: "https://picsum.photos/seed/map/800/800",
    yuppsiesCount: 8,
    createdAt: "2026-10-05T18:00:00Z"
  },
  {
    id: "sub-6",
    userId: "user-5",
    penName: "writer_student",
    anonymous: true,
    day: 5,
    prompt: "Map",
    title: "Cartography of the Soul",
    type: "WRITING",
    genre: "Essay",
    status: "APPROVED",
    content: "We spend our lives drawing lines to divide what is fundamentally whole. The borders on our maps reflect the borders in our minds, artificial constructs designed to make the infinite feel manageable.",
    yuppsiesCount: 112,
    createdAt: "2026-10-05T20:10:00Z"
  },
  {
    id: "sub-7",
    userId: "user-6",
    penName: "novice_artist",
    anonymous: false,
    day: 7,
    prompt: "Shadow",
    title: "Hidden Faces",
    type: "ART",
    status: "APPROVED",
    fileUrl: "https://picsum.photos/seed/faces/600/800",
    yuppsiesCount: 22,
    createdAt: "2026-10-07T12:00:00Z"
  },
  {
    id: "sub-8",
    userId: "user-2",
    penName: "poet_laureate",
    anonymous: false,
    day: 7,
    prompt: "Shadow",
    title: "Dusk over Campus",
    type: "WRITING",
    genre: "Short Story",
    status: "APPROVED",
    content: "The library lights flickered as the sun dipped below the horizon. Sarah packed her bag, the lingering scent of old books and coffee trailing her. Out on the quad, the shadows of the ancient oak trees stretched impossibly long, touching the steps of the science building. She pulled her coat tighter. It was time to go home.",
    yuppsiesCount: 45,
    createdAt: "2026-10-07T16:45:00Z"
  }
];

export const MOCK_USER = {
  id: "user-1",
  penName: "midnightink",
  role: "USER"
};
