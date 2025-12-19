// Client-side compatible version of mock data
// This file can be imported in client components

import type { Trek } from '@/lib/types';

export const initialTreks: Trek[] = [
  {
    id: "manaslu",
    name: "Manaslu Circuit Trek",
    description: "A classic trek offering stunning views of Manaslu, remote villages, and diverse landscapes.",
    permits: [
      { name: "RMP+GT+MCAP+ACAP", rate: 160, times: 1 },
      { name: "Extra days Manaslu permit", rate: 10, times: 1 },
      { name: "RTP+GT+MCAP", rate: 0, times: 1 },
      { name: "Extra days Tsum permit", rate: 0, times: 1 },
    ],
  },
  {
    id: "everest",
    name: "Everest Base Camp Trek",
    description: "The world-famous trek to the foot of Mount Everest, the highest peak on Earth.",
    permits: [
      { name: "Sagarmatha National Park Permit", rate: 30, times: 1 },
      { name: "Khumbu Pasang Lhamu Rural Municipality Fee", rate: 20, times: 1 },
    ],
  },
  {
    id: "annapurna",
    name: "Annapurna Circuit Trek",
    description: "A diverse trek circling the Annapurna massif, featuring high passes and lush valleys.",
    permits: [
      { name: "ACAP Permit", rate: 30, times: 1 },
      { name: "TIMS Card", rate: 20, times: 1 },
    ],
  },
];