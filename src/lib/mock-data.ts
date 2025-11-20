
import type { Trek, Service, Guide, Porter, AirportPickUp } from './types';

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

export const initialGuides: Omit<Guide, 'id'>[] = [
  { name: 'Dorje Sherpa', email: 'dorje.sherpa@example.com', phone: '984-1234567', status: 'Available' },
  { name: 'Lakpa Tamang', email: 'lakpa.tamang@example.com', phone: '984-7654321', status: 'On Tour' },
  { name: 'Nima Lama', email: 'nima.lama@example.com', phone: '986-1122334', status: 'Available' },
  { name: 'Pemba Gurung', email: 'pemba.gurung@example.com', phone: '984-5566778', status: 'On Leave' },
  { name: 'Tenzing Rai', email: 'tenzing.rai@example.com', phone: '981-8899001', status: 'On Tour' },
  { name: 'Sonam Bhote', email: 'sonam.bhote@example.com', phone: '980-3344556', status: 'Available' },
];

export const initialPorters: Omit<Porter, 'id'>[] = [
  { name: 'Kaji Sherpa', phone: '984-2345678', status: 'Available' },
  { name: 'Mingma Tamang', phone: '984-8765432', status: 'On Trek' },
  { name: 'Ang Phurba Lama', phone: '986-2233445', status: 'Available' },
  { name: 'Dawa Gurung', phone: '984-6677889', status: 'On Leave' },
  { name: 'Pasang Rai', phone: '981-9900112', status: 'On Trek' },
  { name: 'Karma Bhote', phone: '980-4455667', status: 'Available' },
];

export const initialAirportPickUp: Omit<AirportPickUp, 'id'>[] = [
  { name: 'Raj Kumar Thapa', email: 'raj.thapa@example.com', phone: '984-1111111', status: 'Available', vehicleType: 'Toyota HiAce', licensePlate: 'BA 1 PA 1234', driverName: 'Raj Kumar Thapa', driverContact: '984-1111111' },
  { name: 'Suman KC', email: 'suman.kc@example.com', phone: '984-2222222', status: 'On Duty', vehicleType: 'Ford Transit', licensePlate: 'BA 2 PA 5678', driverName: 'Suman KC', driverContact: '984-2222222' },
  { name: 'Bikash Maharjan', email: 'bikash.maharjan@example.com', phone: '984-3333333', status: 'Available', vehicleType: 'Mercedes Sprinter', licensePlate: 'BA 3 PA 9012', driverName: 'Bikash Maharjan', driverContact: '984-3333333' },
  { name: 'Prakash Shrestha', email: 'prakash.shrestha@example.com', phone: '984-4444444', status: 'On Leave', vehicleType: 'Nissan Urvan', licensePlate: 'BA 4 PA 3456', driverName: 'Prakash Shrestha', driverContact: '984-4444444' },
  { name: 'Deepak Gurung', email: 'deepak.gurung@example.com', phone: '984-5555555', status: 'On Duty', vehicleType: 'Toyota HiAce', licensePlate: 'BA 5 PA 7890', driverName: 'Deepak Gurung', driverContact: '984-5555555' },
  { name: 'Ramesh Tamang', email: 'ramesh.tamang@example.com', phone: '984-6666666', status: 'Available', vehicleType: 'Ford Transit', licensePlate: 'BA 6 PA 2345', driverName: 'Ramesh Tamang', driverContact: '984-6666666' },
  { name: 'Anil Shah', email: 'anil.shah@example.com', phone: '984-7777777', status: 'Available', vehicleType: 'Mercedes Sprinter', licensePlate: 'BA 7 PA 6789', driverName: 'Anil Shah', driverContact: '984-7777777' },
  { name: 'Kiran Thapa', email: 'kiran.thapa@example.com', phone: '984-8888888', status: 'On Duty', vehicleType: 'Nissan Urvan', licensePlate: 'BA 8 PA 1234', driverName: 'Kiran Thapa', driverContact: '984-8888888' },
  { name: 'Manoj KC', email: 'manoj.kc@example.com', phone: '984-9999999', status: 'On Leave', vehicleType: 'Toyota HiAce', licensePlate: 'BA 9 PA 5678', driverName: 'Manoj KC', driverContact: '984-9999999' },
  { name: 'Sandeep Maharjan', email: 'sandeep.maharjan@example.com', phone: '984-0000000', status: 'Available', vehicleType: 'Ford Transit', licensePlate: 'BA 10 PA 9012', driverName: 'Sandeep Maharjan', driverContact: '984-0000000' },
  { name: 'Nabin Shrestha', email: 'nabin.shrestha@example.com', phone: '984-1212121', status: 'On Duty', vehicleType: 'Mercedes Sprinter', licensePlate: 'BA 11 PA 3456', driverName: 'Nabin Shrestha', driverContact: '984-1212121' },
  { name: 'Dinesh Gurung', email: 'dinesh.gurung@example.com', phone: '984-3434343', status: 'Available', vehicleType: 'Nissan Urvan', licensePlate: 'BA 12 PA 7890', driverName: 'Dinesh Gurung', driverContact: '984-3434343' },
];
