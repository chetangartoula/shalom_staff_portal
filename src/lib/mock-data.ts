
import type { Trek, Service } from './types';

// This file contains the initial static data for the application.
// The API routes will manage the state during runtime, starting with this data.

export const initialTreks: Trek[] = [
  {
    id: "manaslu",
    name: "Manaslu Circuit Trek",
    description: "A classic trek offering stunning views of Manaslu, remote villages, and diverse landscapes.",
    permits: [
      { name: "RMP+GT+MCAP+ACAP", rate: 160 },
      { name: "Extra days Manaslu permit", rate: 10 },
      { name: "RTP+GT+MCAP", rate: 0 },
      { name: "Extra days Tsum permit", rate: 0 },
    ],
  },
  {
    id: "everest",
    name: "Everest Base Camp Trek",
    description: "The world-famous trek to the foot of Mount Everest, the highest peak on Earth.",
    permits: [
      { name: "Sagarmatha National Park Permit", rate: 30 },
      { name: "Khumbu Pasang Lhamu Rural Municipality Fee", rate: 20 },
    ],
  },
  {
    id: "annapurna",
    name: "Annapurna Circuit Trek",
    description: "A diverse trek circling the Annapurna massif, featuring high passes and lush valleys.",
    permits: [
      { name: "ACAP Permit", rate: 30 },
      { name: "TIMS Card", rate: 20 },
    ],
  },
];

// Base services data without IDs. IDs will be added by the API.
export const services: Omit<Service, 'id'>[] = [
    { name: 'Guide days', rate: 30, times: 12 },
    { name: 'Porter days', rate: 25, times: 12 },
    { name: 'Normal Tea house', rate: 35, times: 11 },
    { name: 'Private jeep ktm to trek', rate: 250, times: 1 },
    { name: 'Private jeep trek to ktm/pkr', rate: 250, times: 1 },
    { name: 'International Pick up', rate: 0, times: 1 },
    { name: 'International Drop up', rate: 0, times: 1 },
    { name: 'local ride ktm to trek', rate: 15, times: 1 },
    { name: 'local ride trek to ktm', rate: 35, times: 1 },
    { name: 'Guide insurance', rate: 30, times: 1 },
    { name: 'porter insurance', rate: 20, times: 1 },
    { name: 'Hotel in kathmandu', rate: 0, times: 1 },
];
