import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trophy, Users, Mail, ChevronRight, ChevronLeft, Home, BarChart3, User, Menu, X, Shield, Lock, Award } from 'lucide-react';

// Expanded module data with sub-levels
const modules = [
  // FOSSE LEVEL 1 - Basic Navigation & Check-in
  {
    id: 'fosse-1',
    title: 'FOSSE Level 1: Basic Navigation',
    icon: '💻',
    color: 'bg-blue-500',
    category: 'PMS',
    description: 'System login, navigation, and basic check-in/out',
    questions: [
      { q: 'What function key opens the Main Menu in FOSSE?', options: ['F7', 'F8', 'F10', 'F5'], correct: 1 },
      { q: 'What does F10 do in FOSSE?', options: ['Open menu', 'Cancel action', 'Save/Confirm', 'Print report'], correct: 2 },
      { q: 'What does F7 access?', options: ['Reports', 'Rack Rate/Room Assignment', 'Guest lookup', 'Billing'], correct: 1 },
      { q: 'How do you navigate between fields in FOSSE?', options: ['Arrow keys only', 'TAB key', 'Mouse click', 'Enter key'], correct: 1 },
      { q: 'What is the room type code for a standard room?', options: ['GENR', 'STND', 'REG', 'BASIC'], correct: 0 },
      { q: 'What is the room type code for two queen beds?', options: ['TWOQ', 'QNQN', 'DBLQ', 'QQ'], correct: 1 },
      { q: 'What does BAYV stand for?', options: ['Basic View', 'Bay View', 'Balcony View', 'Back View'], correct: 1 },
      { q: 'Which payment method is NOT acceptable for check-in?', options: ['Chip insert', 'Tap/contactless', 'Card swipe', 'Mobile wallet'], correct: 2 },
      { q: 'Why is card swiping not acceptable?', options: ['Too slow', 'Security/fraud prevention', 'Machine limitation', 'Corporate policy only'], correct: 1 },
      { q: 'When CAN you accept a swiped card?', options: ['Never', 'With Sertifi on file or mobile check-in', 'Manager approval only', 'For elite members'], correct: 1 },
      { q: 'What must be collected from ALL guests at check-in?', options: ['Cash deposit', 'Credit card on file', 'Driver license copy', 'Signed waiver'], correct: 1 },
      { q: 'For a Points Stay (MRYC/MRYA), how do you check them in?', options: ['As credit card', 'As CASH', 'As prepaid', 'As direct bill'], correct: 1 },
      { q: 'For a Points Stay, how much do you collect per night for incidentals?', options: ['$20', '$25', '$30', '$50'], correct: 2 },
      { q: 'What do you enter for room rate on a Points Stay?', options: ['The rack rate', 'The points value', '$0', 'The BAR rate'], correct: 2 },
      { q: 'What is the shift number for AM shift?', options: ['Shift 1', 'Shift 2', 'Shift 3', 'Shift 4'], correct: 1 },
      { q: 'What is the shift number for PM shift?', options: ['Shift 1', 'Shift 2', 'Shift 3', 'Shift 4'], correct: 2 }
    ]
  },
  // FOSSE LEVEL 2 - Reservations & Modifications
  {
    id: 'fosse-2',
    title: 'FOSSE Level 2: Reservations',
    icon: '📋',
    color: 'bg-blue-600',
    category: 'PMS',
    description: 'Reservations, modifications, room moves, and rate changes',
    questions: [
      { q: 'What is the navigation path to view Availability Display?', options: ['F8 > R > V', 'F8 > A > D', 'F7 > R > V', 'F8 > P > B'], correct: 0 },
      { q: 'How do you access Group Reservations?', options: ['F8 > G', 'F8 > R > G', 'F7 > G', 'F8 > TAB > G'], correct: 0 },
      { q: 'How do you access Mobile Check-ins in FOSSE?', options: ['F8 > M', 'F8 > D', 'F8 > TAB > M', 'F7 > M'], correct: 1 },
      { q: 'What is the regular rate code for a GENR room?', options: ['REGA', 'REGB', 'REGF', 'REGG'], correct: 0 },
      { q: 'What is the regular rate code for a QNQN room?', options: ['REGA', 'REGB', 'REGF', 'REGG'], correct: 1 },
      { q: 'What is the government rate code for a GENR room?', options: ['GOV', 'GOVA', 'GOVR', 'GOVT'], correct: 0 },
      { q: 'What is the Marriott prepaid code for a GENR room?', options: ['MS2A', 'MS2B', 'MPA', 'PREP'], correct: 0 },
      { q: 'What is the AAA rate code prefix?', options: ['AAA', 'HDO', 'DISC', 'AUTO'], correct: 1 },
      { q: 'What is the senior rate code prefix?', options: ['SEN', 'XMI', 'SNR', 'AARP'], correct: 1 },
      { q: 'Can you change the name on a reservation at the front desk?', options: ['Yes, anytime', 'No, must go through website/reservations', 'Only with manager approval', 'Only before arrival'], correct: 1 },
      { q: 'Can you add notes about additional guests to a reservation?', options: ['No', 'Yes', 'Only for elites', 'Only with ID'], correct: 1 },
      { q: 'Who receives elite benefits on a reservation?', options: ['All guests in room', 'Only the named guest', 'Whoever checks in first', 'Anyone with elite status'], correct: 1 },
      { q: 'Room requests are:', options: ['Always guaranteed', 'Never guaranteed', 'Guaranteed for elites only', 'Guaranteed if noted'], correct: 1 },
      { q: 'What should you always include with room requests?', options: ['Extra charge', 'Disclaimer that it is not guaranteed', 'Manager signature', 'Guest signature'], correct: 1 }
    ]
  },
  // FOSSE LEVEL 3 - Billing & Adjustments
  {
    id: 'fosse-3',
    title: 'FOSSE Level 3: Billing & Posting',
    icon: '💰',
    color: 'bg-blue-700',
    category: 'PMS',
    description: 'Posting charges, corrections, deposits, and AR',
    questions: [
      { q: 'What is the posting code for Bottled Water?', options: ['BW', 'WTR', 'BTL', 'H2O'], correct: 0 },
      { q: 'How much is the bottled water charge?', options: ['$3', '$4', '$5', '$6'], correct: 2 },
      { q: 'What is the posting code for Food Credit/adjustment?', options: ['FC', 'FD', 'ADJ', 'CRD'], correct: 0 },
      { q: 'What is the posting code for Restaurant Rebate?', options: ['RR', 'FX', 'REB', 'REST'], correct: 1 },
      { q: 'What is the posting code for Paid Out?', options: ['PD', 'PO', 'OUT', 'PAID'], correct: 1 },
      { q: 'What is the posting code for Advance Deposit?', options: ['AD', 'ADV', 'DEP', 'ADVD'], correct: 1 },
      { q: 'What is the posting code for Cancellation Fee?', options: ['CF', 'C3', 'CANC', 'CXL'], correct: 1 },
      { q: 'What is the posting code for Check Refund?', options: ['CR', 'MN', 'REF', 'CHK'], correct: 1 },
      { q: 'To transfer an advance deposit to another reservation, you select:', options: ['Move', 'Transfer', 'Shift', 'Relocate'], correct: 1 },
      { q: 'When keeping an advance deposit on a cancelled reservation, FOSSE posts code:', options: ['C1', 'C2', 'C3', 'C4'], correct: 2 },
      { q: 'If a guest checked out with a credit balance (paid out), first determine:', options: ['Manager approval', 'Why the folio had a credit balance', 'Guest contact info', 'Corporate policy'], correct: 1 },
      { q: 'To fix a paid out situation, walk in a house account and post PO as:', options: ['Positive', 'Negative', 'Zero', 'Double'], correct: 1 },
      { q: 'Credit card numbers are stored in FOSSE as:', options: ['Full numbers', 'Token numbers (encrypted)', 'Last 4 digits only', 'Not stored at all'], correct: 1 },
      { q: 'To unmask a token, call:', options: ['FOSSE Help Desk', 'Shift4/Merchant Link', 'Corporate', 'The bank'], correct: 1 },
      { q: 'What is the Shift4/Merchant Link phone number?', options: ['240-632-6000', '301-562-5002', '800-831-3100', '619-221-1900'], correct: 1 }
    ]
  },
  // FOSSE LEVEL 4 - Reports & Advanced
  {
    id: 'fosse-4',
    title: 'FOSSE Level 4: Reports & Advanced',
    icon: '📊',
    color: 'bg-blue-800',
    category: 'PMS',
    description: 'Running reports, troubleshooting, and advanced functions',
    questions: [
      { q: 'What is the path to print the Arrivals report?', options: ['F8 > TAB > F > P > A', 'F8 > R > A', 'F7 > A', 'F8 > A > P'], correct: 0 },
      { q: 'What is the path to print the Departures report?', options: ['F8 > TAB > F > P > D', 'F8 > R > D', 'F7 > D', 'F8 > D > P'], correct: 0 },
      { q: 'What is the path to print the Contingency report?', options: ['F8 > TAB > F > P > C', 'F8 > C > P', 'F7 > C', 'F8 > TAB > C'], correct: 0 },
      { q: 'What is the path to print the Guest Ledger?', options: ['F8 > TAB > F > P > G', 'F8 > G > L', 'F7 > G', 'F8 > L > G'], correct: 0 },
      { q: 'What is the path to close your shift?', options: ['F8 > TAB > F > C > S', 'F8 > S > C', 'F8 > C > S', 'F10 > C > S'], correct: 0 },
      { q: 'After logging in to close shift, what option must you select?', options: ['S for Save', 'U for Update', 'C for Close', 'P for Print'], correct: 1 },
      { q: 'What is the path for ADR calculation?', options: ['F8 > P > B', 'F8 > A > D', 'F7 > ADR', 'F8 > R > A'], correct: 0 },
      { q: 'What is the path for Charge Code Activity report?', options: ['F8 > TAB > F > C > C', 'F8 > C > A', 'F8 > R > C', 'F7 > C > C'], correct: 0 },
      { q: 'In Document Archive Retrieval, what is the MARSHA Production Report number?', options: ['#10', '#21', '#37', '#39'], correct: 3 },
      { q: 'What is the Daily Segmentation Report number?', options: ['#10', '#21', '#37', '#39'], correct: 2 },
      { q: 'What is the Daily Closing Report Summary number?', options: ['#10', '#21', '#37', '#39'], correct: 0 },
      { q: 'What is the Daily Variance Exception Report number?', options: ['#10', '#21', '#37', '#39'], correct: 1 },
      { q: 'Where do you find credit card variances first?', options: ['Guest folio', 'Daily Variance Exception Report', 'Manager email', 'Shift audit'], correct: 1 },
      { q: 'To close sold out inventory, go to F8 > Marsha Functions > Request Marsha Screen >', options: ['Inventory Control', 'Room Control', 'Rate Control', 'Availability'], correct: 0 },
      { q: 'After closing inventory, what must appear on Availability Display?', options: ['SOLD', 'NMQ', 'CLOSED', 'ZERO'], correct: 1 }
    ]
  },
  // BRAND STANDARDS
  {
    id: 'brand',
    title: 'Module 2: Brand Standards',
    icon: '⭐',
    color: 'bg-purple-600',
    category: 'Brand',
    description: 'Marriott service culture, elite recognition, and standards',
    questions: [
      { q: 'Which is a Marriott core principle?', options: ['Maximize revenue', 'Put people first', 'Beat competitors', 'Reduce costs'], correct: 1 },
      { q: 'Which is a Marriott core principle?', options: ['Pursue excellence', 'Work faster', 'Limit expenses', 'Avoid risks'], correct: 0 },
      { q: 'Which is a Marriott core principle?', options: ['Embrace change', 'Maintain status quo', 'Minimize training', 'Reduce staff'], correct: 0 },
      { q: 'Which is a Marriott core principle?', options: ['Act with integrity', 'Hide mistakes', 'Blame others', 'Cut corners'], correct: 0 },
      { q: 'Which is a Marriott core principle?', options: ['Ignore community', 'Serve our world', 'Focus only on guests', 'Avoid charity'], correct: 1 },
      { q: 'Gold Elite guests receive late checkout until what time (when available)?', options: ['12:00 PM', '1:00 PM', '2:00 PM', '4:00 PM'], correct: 2 },
      { q: 'Which elite status level is GUARANTEED a 4:00 PM checkout?', options: ['Gold', 'Silver', 'Platinum and above', 'All members'], correct: 2 },
      { q: 'Gold Elite standard checkout time is:', options: ['11:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'], correct: 1 },
      { q: 'What benefit does Ambassador Elite receive that others do not?', options: ['Free breakfast', 'Your24 flexible check-in/out', 'Free parking', 'Room upgrade'], correct: 1 },
      { q: 'Titanium Elite members receive what bonus on points?', options: ['25%', '50%', '75%', '100%'], correct: 2 },
      { q: 'Which elite tier gets a Personal Ambassador?', options: ['Platinum', 'Titanium', 'Ambassador', 'All elites'], correct: 2 },
      { q: 'For non-elite/Gold guests, who approves late checkout requests?', options: ['Front desk decides', 'Housekeeping', 'GM only', 'Corporate'], correct: 1 },
      { q: 'When can non-elite guests request late checkout?', options: ['At booking', 'Day before', 'Morning of checkout', 'Anytime'], correct: 2 },
      { q: 'How many Acts of Awe should you aim for per shift?', options: ['One', 'Two', 'Three', 'None required'], correct: 1 },
      { q: 'What is the MINIMUM Acts of Awe per shift?', options: ['None', 'One', 'Two', 'Three'], correct: 1 },
      { q: 'Where must Acts of Awe be documented?', options: ['GXP', 'MOD Report', 'FOSSE notes', 'Email to GM'], correct: 1 },
      { q: 'Which is an appropriate Act of Awe?', options: ['Complimentary waters', 'Free room upgrade always', 'Waiving all charges', 'Ignoring policies'], correct: 0 },
      { q: 'Which is an appropriate Act of Awe?', options: ['Drink vouchers for bar', 'Free dinner', 'Cash gift', 'Points without approval'], correct: 0 },
      { q: 'What rate code gets guaranteed drink vouchers plus discounted paddleboard rentals?', options: ['REGA', 'ZZLO', 'ELITE', 'PROMO'], correct: 1 },
      { q: 'When using drink vouchers, remember:', options: ['Use freely', 'Each voucher reduces staff tips', 'They have no cost', 'Give unlimited'], correct: 1 }
    ]
  },
  // SAFETY & COMPLIANCE - CPR/Medical
  {
    id: 'safety-1',
    title: 'Safety: CPR & Medical',
    icon: '🏥',
    color: 'bg-red-500',
    category: 'Safety',
    description: 'CPR certification, AED, and medical emergencies',
    questions: [
      { q: 'Within how many days of hire must you obtain CPR certification?', options: ['7 days', '14 days', '30 days', '60 days'], correct: 2 },
      { q: 'How often must CPR certification be renewed?', options: ['Every year', 'Every 2 years', 'Every 3 years', 'Every 5 years'], correct: 1 },
      { q: 'Where is the AED located?', options: ['Back office', 'Front desk storage area', 'Pool area', 'Housekeeping'], correct: 1 },
      { q: 'In a medical emergency, what do you do FIRST?', options: ['Call MOD', 'Call 911', 'Find AED', 'Clear area'], correct: 1 },
      { q: 'After calling 911, who should you notify?', options: ['Corporate', 'MOD/Manager', 'Other guests', 'Media'], correct: 1 },
      { q: 'What does AED stand for?', options: ['Automatic Emergency Device', 'Automated External Defibrillator', 'Advanced Emergency Defense', 'Auxiliary Electric Device'], correct: 1 },
      { q: 'CPR stands for:', options: ['Cardiac Pulse Recovery', 'Cardiopulmonary Resuscitation', 'Central Pressure Response', 'Critical Patient Recovery'], correct: 1 },
      { q: 'If a guest appears to be having a heart attack, you should:', options: ['Wait and see', 'Call 911 immediately', 'Give them water', 'Have them walk it off'], correct: 1 },
      { q: 'Incident reports should be completed:', options: ['Next day', 'End of week', 'Immediately after incident', 'Only if requested'], correct: 2 },
      { q: 'Medical information about guests should be:', options: ['Shared with all staff', 'Kept confidential', 'Posted in break room', 'Discussed openly'], correct: 1 }
    ]
  },
  // SAFETY & COMPLIANCE - Alcohol
  {
    id: 'safety-2',
    title: 'Safety: Alcohol Service',
    icon: '🍷',
    color: 'bg-red-600',
    category: 'Safety',
    description: 'RBS certification and responsible alcohol service',
    questions: [
      { q: 'What certification is required in California for alcohol service?', options: ['TIPS', 'RBS', 'ServSafe', 'ABC'], correct: 1 },
      { q: 'RBS stands for:', options: ['Responsible Bar Service', 'Responsible Beverage Service', 'Required Beverage Standards', 'Restaurant Bar Safety'], correct: 1 },
      { q: 'You should check ID for anyone appearing under age:', options: ['21', '30', '40', '25'], correct: 2 },
      { q: 'Which is an acceptable form of ID?', options: ['School ID', 'Passport', 'Library card', 'Employee badge'], correct: 1 },
      { q: 'Which is an acceptable form of ID?', options: ['Student ID', 'Military ID', 'Gym membership', 'Credit card'], correct: 1 },
      { q: 'Which is an acceptable form of ID?', options: ['Birth certificate', 'Social security card', 'State-issued ID', 'Voter registration'], correct: 2 },
      { q: 'Which is NOT an acceptable form of ID?', options: ['Driver license', 'Passport', 'School ID', 'Military ID'], correct: 2 },
      { q: 'If a guest appears intoxicated, you should:', options: ['Serve them anyway', 'Refuse service', 'Call police immediately', 'Ignore them'], correct: 1 },
      { q: 'Signs of intoxication include:', options: ['Slurred speech', 'Clear communication', 'Steady walking', 'Sharp focus'], correct: 0 },
      { q: 'If you refuse service, you should:', options: ['Be confrontational', 'Document the incident', 'Argue with guest', 'Serve them one more'], correct: 1 },
      { q: 'The legal drinking age in California is:', options: ['18', '19', '20', '21'], correct: 3 },
      { q: 'Serving a minor can result in:', options: ['Warning only', 'Criminal charges', 'No consequences', 'Minor fine'], correct: 1 }
    ]
  },
  // SAFETY & COMPLIANCE - Training
  {
    id: 'safety-3',
    title: 'Safety: Required Training',
    icon: '📚',
    color: 'bg-red-700',
    category: 'Safety',
    description: 'DLZ, Trakstar, and compliance training requirements',
    questions: [
      { q: 'DLZ stands for:', options: ['Digital Learning Zone', 'Distance Learning Zone', 'Daily Learning Zone', 'Direct Learning Zone'], correct: 0 },
      { q: 'Where do you complete required Marriott training modules?', options: ['YouTube', 'DLZ', 'Google', 'Email'], correct: 1 },
      { q: 'Trakstar is used for:', options: ['Guest complaints', 'Performance management and training tracking', 'Reservations', 'Payroll'], correct: 1 },
      { q: 'Required trainings should be completed:', options: ['Whenever convenient', 'Before deadline', 'Only if reminded', 'Next year'], correct: 1 },
      { q: 'Which is a required DLZ module?', options: ['Cooking basics', 'Guest Service Foundations', 'Personal finance', 'Home repair'], correct: 1 },
      { q: 'Which is a required DLZ module?', options: ['Safety & Security Awareness', 'Sports trivia', 'Music appreciation', 'Art history'], correct: 0 },
      { q: 'Which is a required DLZ module?', options: ['Gaming strategies', 'Human Trafficking Awareness', 'Fashion design', 'Car repair'], correct: 1 },
      { q: 'Which is a required DLZ module?', options: ['Data Privacy & Protection', 'Gardening tips', 'Pet care', 'Travel blogs'], correct: 0 },
      { q: 'Training completion certificates should be:', options: ['Discarded', 'Saved/documented', 'Ignored', 'Shared publicly'], correct: 1 },
      { q: 'If you see signs of human trafficking, you should:', options: ['Ignore it', 'Report to management/authorities', 'Confront the person', 'Post on social media'], correct: 1 }
    ]
  },
  // NIGHT AUDIT
  {
    id: 'night-audit',
    title: 'Module 4A: Night Audit',
    icon: '🌙',
    color: 'bg-green-600',
    category: 'Cross-Training',
    description: 'Complete Night Audit procedures and responsibilities',
    questions: [
      { q: 'What is the shift number for Night Audit?', options: ['Shift 1', 'Shift 2', 'Shift 3', 'Shift 4'], correct: 0 },
      { q: 'How much should be in each front desk drawer?', options: ['$200', '$250', '$300', '$350'], correct: 2 },
      { q: 'At shift start, which systems should be open?', options: ['Only FOSSE', 'Shuttle log, Lodgistics, GXP & Lyft', 'Email only', 'Nothing'], correct: 1 },
      { q: 'All remaining arrivals should be blocked into what type of room?', options: ['Any room', 'Vacant Ready room', 'Dirty room', 'OOO room'], correct: 1 },
      { q: 'What must be verified before Night Audit runs?', options: ['Shift 2 closed', 'Shift 3 closed', 'All shifts closed', 'Nothing'], correct: 1 },
      { q: 'Guest Ledger should be printed sorted by:', options: ['Room number', 'Guest name', 'Company name', 'Rate code'], correct: 2 },
      { q: 'What do you do with AM & PM restaurant receipts?', options: ['Throw away', 'Sort into respective envelopes', 'Leave scattered', 'Give to guest'], correct: 1 },
      { q: 'Where do you switch out the tape?', options: ['Front desk', 'PBX room', 'Back office', 'Pool area'], correct: 1 },
      { q: 'TFB account should be adjusted to:', options: ['$100', 'Room rate', 'Zero', 'Leave it'], correct: 2 },
      { q: 'To adjust TFB, use post code:', options: ['FX', 'FC', 'TF', 'FB'], correct: 1 },
      { q: 'When does MICROS POLL READY typically flash?', options: ['At midnight', 'After 2:00 AM', 'At 6:00 AM', 'Anytime'], correct: 1 },
      { q: 'The path for MICROS Polling is:', options: ['F8 > TAB > A > D > M', 'F8 > M > P', 'F7 > MICROS', 'F8 > P > M'], correct: 0 },
      { q: 'FD charges in the charge code activity report should be at:', options: ['$100', 'Room total', 'Zero', 'Any amount'], correct: 2 },
      { q: 'If FD charges are not zero, charge off balance to:', options: ['Guest', 'FX', 'Manager', 'Cash'], correct: 1 },
      { q: 'What happens during ONE BUTTON?', options: ['FOSSE runs faster', 'FOSSE is unavailable', 'Reports auto-print', 'Nothing'], correct: 1 },
      { q: 'ONE BUTTON typically runs for:', options: ['5 minutes', '10-15 minutes', '30 minutes', '1 hour'], correct: 1 },
      { q: 'During ONE BUTTON, you should:', options: ['Wait at desk', 'Replenish market and supplies', 'Go home', 'Sleep'], correct: 1 },
      { q: 'For Points reservation no-shows, charge:', options: ['Nothing', 'BAR rate', 'Points value', 'Cancellation fee only'], correct: 1 },
      { q: 'For GNS reservations, advance deposits should be:', options: ['Refunded', 'Kept', 'Ignored', 'Transferred'], correct: 1 },
      { q: 'Before AM shift, the hotel should be:', options: ['Dark and quiet', 'House Ready', 'Closed', 'Unchanged'], correct: 1 },
      { q: 'House Ready includes:', options: ['Lights on, lobby music up', 'Everything off', 'Doors locked', 'Pool closed'], correct: 0 },
      { q: 'MARKET accounts should be closed by changing payment from:', options: ['CA to DB', 'DB to CA', 'CK to CA', 'CA to CK'], correct: 1 },
      { q: 'For Gold+ guests, void off what charges?', options: ['Room charges', 'DATA SERVICE (IA & IB)', 'All charges', 'Restaurant charges'], correct: 1 },
      { q: 'At end of shift, what report must be completed and sent?', options: ['Arrivals', 'MOD report', 'Revenue', 'Housekeeping'], correct: 1 }
    ]
  },
  // HOMEWOOD CROSS-TRAINING
  {
    id: 'homewood',
    title: 'Module 4B: Homewood Suites',
    icon: '🏠',
    color: 'bg-green-700',
    category: 'Cross-Training',
    description: 'Sister property operations and differences',
    questions: [
      { q: 'Homewood Suites is what type of property?', options: ['Budget hotel', 'Extended stay', 'Resort', 'Conference center'], correct: 1 },
      { q: 'Homewood rooms feature:', options: ['Standard rooms only', 'Suites with kitchens', 'No amenities', 'Shared bathrooms'], correct: 1 },
      { q: 'Homewood offers complimentary breakfast:', options: ['Never', 'Weekends only', 'Daily', 'Platinum+ only'], correct: 2 },
      { q: 'Evening social at Homewood is offered:', options: ['Daily', 'Monday through Thursday', 'Weekends only', 'Never'], correct: 1 },
      { q: 'Homewood uses what PMS system?', options: ['Different system', 'Same FOSSE system', 'Paper only', 'No system'], correct: 1 },
      { q: 'Homewood has a different:', options: ['FOSSE system', 'Property code', 'Company', 'Brand'], correct: 1 },
      { q: 'The parking lot is shared between:', options: ['Just the two hotels', 'Hotels and Conference Center', 'Public only', 'No sharing'], correct: 1 },
      { q: 'Staff can be scheduled at:', options: ['Courtyard only', 'Homewood only', 'Either property', 'Neither'], correct: 2 },
      { q: 'Extended stay guests typically stay:', options: ['1 night', '1 week or longer', '2-3 hours', 'Exactly 3 nights'], correct: 1 },
      { q: 'Homewood is located:', options: ['Miles away', 'Next door/adjacent', 'Different city', 'Same building'], correct: 1 }
    ]
  },
  // GUEST SERVICE - GXP & Points
  {
    id: 'guest-1',
    title: 'Guest Service: GXP & Points',
    icon: '🎯',
    color: 'bg-yellow-500',
    category: 'Guest Service',
    description: 'Guest Experience Platform and loyalty points',
    questions: [
      { q: 'GXP stands for:', options: ['Guest Experience Platform', 'General Exchange Protocol', 'Guest Exemption Process', 'Global Experience Program'], correct: 0 },
      { q: 'GXP is used for:', options: ['Reservations', 'Tracking and resolving service issues', 'Payroll', 'Housekeeping'], correct: 1 },
      { q: 'To look up a guest in GXP, you need:', options: ['Room number only', 'Last name and Bonvoy number', 'Email only', 'Phone number'], correct: 1 },
      { q: 'To issue points in GXP, select:', options: ['New Complaint', 'New eBonus', 'New Reservation', 'New Note'], correct: 1 },
      { q: 'Approximately how much are 5,000 Marriott points worth?', options: ['$10', '$25', '$50', '$100'], correct: 1 },
      { q: 'Approximately how much are 10,000 Marriott points worth?', options: ['$25', '$50', '$75', '$100'], correct: 1 },
      { q: 'Approximately how much are 20,000 Marriott points worth?', options: ['$50', '$75', '$100', '$150'], correct: 2 },
      { q: 'For e-cert mistakes (guest charged instead of points), create a case under:', options: ['Complaints', 'Marriott Bonvoy Support', 'Reservations', 'Billing'], correct: 1 },
      { q: 'Select what type of case for certificate issues?', options: ['General Complaint', 'Marriott Bonvoy Certificate Request', 'Rate Dispute', 'Room Issue'], correct: 1 },
      { q: 'All GXP cases should be:', options: ['Ignored', 'Properly documented and followed up', 'Deleted', 'Hidden'], correct: 1 }
    ]
  },
  // GUEST SERVICE - Compensation & Recovery
  {
    id: 'guest-2',
    title: 'Guest Service: Compensation',
    icon: '💝',
    color: 'bg-yellow-600',
    category: 'Guest Service',
    description: 'Compensation authority and guest recovery',
    questions: [
      { q: 'Front desk can offer parking waived for:', options: ['Never', 'Use judgment for duration', '1 night only', 'Unlimited'], correct: 1 },
      { q: 'Front desk can offer up to what off room rate?', options: ['$50', '$75', '$100', '$150'], correct: 2 },
      { q: 'Front desk can offer how many points for compensation?', options: ['5,000-10,000', '10,000-20,000', '25,000-50,000', 'Unlimited'], correct: 1 },
      { q: 'After giving compensation, you MUST:', options: ['Do nothing', 'Email management', 'Call corporate', 'Hide it'], correct: 1 },
      { q: 'The compensation email should include:', options: ['Just guest name', 'Guest name, folio, reason, and what was given', 'Nothing', 'Only the amount'], correct: 1 },
      { q: 'What is the FIRST step in guest recovery?', options: ['Apologize', 'Listen', 'Solve', 'Thank'], correct: 1 },
      { q: 'What is the SECOND step in guest recovery?', options: ['Listen', 'Apologize', 'Solve', 'Document'], correct: 1 },
      { q: 'What is the THIRD step in guest recovery?', options: ['Thank', 'Listen', 'Solve', 'Apologize'], correct: 2 },
      { q: 'What is the FOURTH step in guest recovery?', options: ['Listen', 'Apologize', 'Document', 'Thank'], correct: 3 },
      { q: 'What is the FIFTH/final step in guest recovery?', options: ['Thank', 'Document', 'Solve', 'Listen'], correct: 1 },
      { q: 'The guest recovery process is:', options: ['Listen, Apologize, Solve, Thank, Document', 'Solve, Listen, Thank, Apologize', 'Document, Solve, Thank, Listen', 'Apologize, Document, Solve, Listen'], correct: 0 },
      { q: 'When apologizing, you should:', options: ['Blame others', 'Be sincere even if not your fault', 'Argue', 'Make excuses'], correct: 1 },
      { q: 'Drink vouchers should be used:', options: ['Freely', 'Sparingly for service recovery', 'Never', 'For all guests'], correct: 1 }
    ]
  },
  // GUEST SERVICE - Upselling
  {
    id: 'guest-3',
    title: 'Guest Service: Upselling',
    icon: '📈',
    color: 'bg-yellow-700',
    category: 'Guest Service',
    description: 'Upselling techniques and opportunities',
    questions: [
      { q: 'What is the FOSSE code for Early Check-In?', options: ['EC1', 'ECI', 'E1', 'EARLY'], correct: 2 },
      { q: 'Room upgrade opportunities include:', options: ['Bay View', 'Downgrade only', 'No options', 'Same room'], correct: 0 },
      { q: 'Which is an upsell opportunity?', options: ['Waterfront View room', 'Standard room', 'Less amenities', 'Smaller room'], correct: 0 },
      { q: 'Early check-in is an upsell when:', options: ['Never', 'Guest requests and room is ready', 'Always free', 'Not allowed'], correct: 1 },
      { q: 'Late checkout can be offered as upsell when:', options: ['Never', 'Available and guest requests', 'Always free', 'Prohibited'], correct: 1 },
      { q: 'Parking packages are:', options: ['Never sold', 'An upsell opportunity', 'Always free', 'Not available'], correct: 1 },
      { q: 'Market items are:', options: ['Free for all', 'An upsell/revenue opportunity', 'Not for sale', 'Staff only'], correct: 1 },
      { q: 'Upselling benefits:', options: ['Only the hotel', 'Guest experience AND hotel revenue', 'Nobody', 'Only the guest'], correct: 1 },
      { q: 'When upselling, you should:', options: ['Be pushy', 'Offer value and benefits', 'Force the sale', 'Lie about features'], correct: 1 },
      { q: 'If a guest declines an upsell, you should:', options: ['Keep pushing', 'Accept gracefully', 'Get angry', 'Report them'], correct: 1 }
    ]
  },
  // SYSTEMS - Tax Exempt
  {
    id: 'systems-1',
    title: 'Systems: Tax Exempt',
    icon: '📋',
    color: 'bg-indigo-500',
    category: 'Systems',
    description: 'Tax exempt processing and verification',
    questions: [
      { q: 'Tax exempt forms must be:', options: ['Verbal only', 'Physical form collected', 'Email only', 'Not required'], correct: 1 },
      { q: 'Where can guests print tax exempt forms?', options: ['Front desk printer', 'Business center', 'Their room', 'Not available'], correct: 1 },
      { q: 'Tax exempt forms are verified using:', options: ['Google', 'Explore Form Verifier', 'Guest word', 'Manager approval'], correct: 1 },
      { q: 'What color indicates APPROVED in Form Verifier?', options: ['Red', 'Yellow', 'Green', 'Blue'], correct: 2 },
      { q: 'What color indicates FAKE/EXPIRED in Form Verifier?', options: ['Red', 'Yellow', 'Green', 'Blue'], correct: 0 },
      { q: 'If form shows red/error, you should:', options: ['Accept anyway', 'Charge regular rate', 'Call corporate', 'Let them go'], correct: 1 },
      { q: 'In FOSSE, tax exempt path starts with:', options: ['Folio > Edit', 'F8 > Tax', 'F7 > Exempt', 'Main Menu > Tax'], correct: 0 },
      { q: 'After Edit, the path is:', options: ['TAB to CC > F5 > F1 on TAX RULE', 'Save immediately', 'Print form', 'Exit'], correct: 0 },
      { q: 'What is the tax rule code for Room Tax Exempt?', options: ['7', '8', '9', '10'], correct: 2 },
      { q: 'On the form, write:', options: ['Nothing', 'Confirmation number and date', 'Your name', 'Guest complaint'], correct: 1 },
      { q: 'Tax exempt forms are filed:', options: ['Randomly', 'Alphabetically by last name', 'By date only', 'Not filed'], correct: 1 },
      { q: 'Who typically qualifies for tax exempt?', options: ['Anyone who asks', 'Government and qualifying non-profits', 'All businesses', 'Marriott employees'], correct: 1 }
    ]
  },
  // SYSTEMS - Sertifi
  {
    id: 'systems-2',
    title: 'Systems: Sertifi Authorization',
    icon: '🔐',
    color: 'bg-indigo-600',
    category: 'Systems',
    description: 'Sertifi credit card authorization process',
    questions: [
      { q: 'Sertifi is used for:', options: ['Reservations', 'Secure credit card authorizations', 'Housekeeping', 'Payroll'], correct: 1 },
      { q: 'Sertifi is for what type of stays?', options: ['All stays', 'Business stays only', 'Leisure only', 'Points only'], correct: 1 },
      { q: 'Sertifi requires what type of email?', options: ['Personal (Gmail, Yahoo)', 'Any email', 'Business email only', 'No email'], correct: 2 },
      { q: 'Can you send Sertifi to a Gmail address?', options: ['Yes', 'No', 'Sometimes', 'With approval'], correct: 1 },
      { q: 'Can you send a Sertifi for same-day reservations?', options: ['Yes, always', 'No (fraud prevention)', 'Sometimes', 'Only weekends'], correct: 1 },
      { q: 'Who can approve Sertifi exceptions?', options: ['Any staff', 'Manager', 'Guest', 'Corporate only'], correct: 1 },
      { q: 'Stay extensions require:', options: ['Nothing new', 'New Sertifi for additional nights', 'Manager only', 'Cash deposit'], correct: 1 },
      { q: 'To send a Sertifi, go to Create New and select:', options: ['New Guest', 'Send Authorization', 'New Reservation', 'Print Form'], correct: 1 },
      { q: 'The Sertifi folder name should contain:', options: ['Just guest name', 'Just folio number', 'Guest name & folio number', 'Date only'], correct: 2 },
      { q: 'Date to Auto Expire should be set to:', options: ['Today', 'Check-in date', 'Checkout date', 'Next month'], correct: 1 },
      { q: 'To process a completed Sertifi, go to View menu and:', options: ['View Guests', 'View Authorizations', 'View Reports', 'View History'], correct: 1 },
      { q: 'After inputting Sertifi CC, add note:', options: ['Nothing', 'Sertifi on file for Room & Tax - Get CC for incidentals', 'Paid in full', 'No note needed'], correct: 1 },
      { q: 'At check-in with Sertifi, create:', options: ['Nothing extra', 'Separate incidental folio', 'New reservation', 'Complaint'], correct: 1 }
    ]
  },
  // SYSTEMS - Unifocus & Mobile
  {
    id: 'systems-3',
    title: 'Systems: Unifocus & Mobile CI',
    icon: '📱',
    color: 'bg-indigo-700',
    category: 'Systems',
    description: 'Time clock and mobile check-in procedures',
    questions: [
      { q: 'Unifocus is used for:', options: ['Guest complaints', 'Timekeeping', 'Reservations', 'Housekeeping'], correct: 1 },
      { q: 'You should clock in:', options: ['Anytime', 'At start of shift', 'End of shift', 'Not required'], correct: 1 },
      { q: 'For meal breaks over 30 minutes, you should:', options: ['Stay clocked in', 'Clock out', 'Not take breaks', 'Get approval'], correct: 1 },
      { q: 'Missed punches should be reported:', options: ['Next week', 'Immediately to supervisor', 'Never', 'End of month'], correct: 1 },
      { q: 'You should review your timecard:', options: ['Never', 'Weekly for accuracy', 'Yearly', 'Only if asked'], correct: 1 },
      { q: 'Mobile check-in requires what minimum elite status?', options: ['Silver', 'Gold', 'Platinum', 'Any member'], correct: 1 },
      { q: 'For mobile check-in, what must be verified?', options: ['Nothing', 'Advance deposit', 'Manager approval', 'Corporate call'], correct: 1 },
      { q: 'Mobile check-in also requires confirmed:', options: ['Room upgrade', 'Reason for visit', 'Car type', 'Favorite color'], correct: 1 },
      { q: 'Mobile check-ins are accessed in FOSSE via:', options: ['F7', 'F8 > D', 'F10', 'F8 > M'], correct: 1 },
      { q: 'If mobile check-in requirements not met, add:', options: ['Nothing', 'See Front Desk notation', 'Cancel reservation', 'Charge fee'], correct: 1 }
    ]
  },
  // KNOWLEDGE - Hotel Info
  {
    id: 'knowledge-1',
    title: 'Knowledge: Hotel Information',
    icon: '🏨',
    color: 'bg-teal-500',
    category: 'Knowledge',
    description: 'Property-specific information and amenities',
    questions: [
      { q: 'What is the property name?', options: ['Marriott Downtown', 'Courtyard by Marriott Liberty Station', 'Hilton Liberty', 'Homewood Suites'], correct: 1 },
      { q: 'The hotel is located in:', options: ['Los Angeles', 'San Diego', 'San Francisco', 'Sacramento'], correct: 1 },
      { q: 'Standard check-in time is:', options: ['2:00 PM', '3:00 PM', '4:00 PM', '12:00 PM'], correct: 1 },
      { q: 'Standard check-out time is:', options: ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM'], correct: 1 },
      { q: 'Gold Elite checkout time is:', options: ['11:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'], correct: 1 },
      { q: 'Platinum+ guaranteed checkout is:', options: ['12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'], correct: 2 },
      { q: 'The hotel has how many room types?', options: ['2', '3', '4', '5'], correct: 2 },
      { q: 'GENR stands for:', options: ['General', 'Standard/Generic', 'Generator', 'Genre'], correct: 1 },
      { q: 'VIEW rooms feature:', options: ['No view', 'Waterfront view', 'Parking view', 'Wall view'], correct: 1 },
      { q: 'WiFi is:', options: ['Not available', 'Paid only', 'Complimentary', 'Elite only'], correct: 2 },
      { q: 'The fitness center is open:', options: ['9-5 only', '24 hours', 'Weekends only', 'Closed'], correct: 1 },
      { q: 'The pool is:', options: ['Indoor', 'Outdoor', 'No pool', 'Rooftop'], correct: 1 },
      { q: 'Our sister property is:', options: ['Marriott Downtown', 'Homewood Suites', 'Hilton', 'Holiday Inn'], correct: 1 },
      { q: 'FOSSE Help Desk Critical number is:', options: ['240-632-6000 Opt 1', '800-831-3100', '619-221-1900', '911'], correct: 0 }
    ]
  },
  // KNOWLEDGE - Coastal Commission
  {
    id: 'knowledge-2',
    title: 'Knowledge: Coastal Commission',
    icon: '🌊',
    color: 'bg-teal-600',
    category: 'Knowledge',
    description: 'California Coastal Commission requirements',
    questions: [
      { q: 'Liberty Station is within the California:', options: ['Desert Zone', 'Coastal Zone', 'Mountain Zone', 'Valley Zone'], correct: 1 },
      { q: 'The Coastal Commission requires:', options: ['Private beaches', 'Public access maintained', 'No visitors', 'Closed areas'], correct: 1 },
      { q: 'The parking lot must be available for public use during:', options: ['Never', 'Daytime hours', 'Nighttime only', 'Weekends only'], correct: 1 },
      { q: 'Can the hotel restrict public from Liberty Station common areas?', options: ['Yes', 'No', 'Sometimes', 'With fees'], correct: 1 },
      { q: 'Can the hotel offer Park and Fly services?', options: ['Yes, always', 'No, due to parking constraints', 'Weekends only', 'For elites only'], correct: 1 },
      { q: 'Why can\'t Park and Fly be offered?', options: ['Too expensive', 'Coastal Commission parking requirements', 'No demand', 'Staff shortage'], correct: 1 },
      { q: 'Parking is shared between how many entities?', options: ['One', 'Two (Hotels and Conference Center)', 'Three', 'None'], correct: 1 },
      { q: 'Parking priority is:', options: ['Public first', 'Hotel guests > Conference > Public', 'First come first served', 'No priority'], correct: 1 },
      { q: 'During large events, parking may be:', options: ['Unlimited', 'Limited - communicate to guests', 'Closed', 'Free'], correct: 1 },
      { q: 'Coastal Commission signage requirements are for:', options: ['Advertising', 'Public coastal access', 'Hotel branding', 'Nothing'], correct: 1 }
    ]
  },
  // LODGISTICS & MAINTENANCE
  {
    id: 'lodgistics',
    title: 'Systems: Lodgistics & Maintenance',
    icon: '🔧',
    color: 'bg-orange-600',
    category: 'Systems',
    description: 'Maintenance tickets and Lodgistics procedures',
    questions: [
      { q: 'ALL maintenance tickets MUST be input via:', options: ['Email', 'Kipsu (Lodgistics)', 'Phone call', 'Paper form'], correct: 1 },
      { q: 'In Lodgistics, click what to create a ticket?', options: ['New Guest', 'Maintenance > Create Maintenance Ticket', 'Reports', 'Settings'], correct: 1 },
      { q: 'What must you input on the ticket?', options: ['Just room number', 'Room number & issue from menu', 'Just description', 'Nothing'], correct: 1 },
      { q: 'The issue should be described in:', options: ['One word', 'Notes section - FULLY describe', 'Not at all', 'Email separately'], correct: 1 },
      { q: 'After submitting the ticket, you should:', options: ['Do nothing else', 'Radio engineering', 'Wait for response', 'Call manager'], correct: 1 },
      { q: 'Cash log is accessed where?', options: ['FOSSE', 'Lodgistics', 'Email', 'Paper only'], correct: 1 },
      { q: 'When saving cash log entry, enter the:', options: ['Total dollar amount', 'Physical NUMBER of coins/bills', 'Approximate amount', 'Nothing'], correct: 1 },
      { q: 'Cash log should be saved at:', options: ['End of shift only', 'Start & finish of shift', 'Once a week', 'Never'], correct: 1 },
      { q: 'Any cash variances should be:', options: ['Ignored', 'Dropped/reported IMMEDIATELY', 'Fixed tomorrow', 'Hidden'], correct: 1 },
      { q: 'The shift checklist must be:', options: ['Ignored', 'Started and completed by selecting check marks', 'Done mentally', 'Optional'], correct: 1 }
    ]
  }
];

const MANAGER_PIN = '1234'; // Change this to your actual PIN

export default function TrainingPortal() {
  const [currentView, setCurrentView] = useState('home');
  const [currentModule, setCurrentModule] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [allScores, setAllScores] = useState({});
  const [userScores, setUserScores] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [manualCompletions, setManualCompletions] = useState({});
  const [showManagerPanel, setShowManagerPanel] = useState(false);
  const [managerPin, setManagerPin] = useState('');
  const [managerUnlocked, setManagerUnlocked] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedModuleToComplete, setSelectedModuleToComplete] = useState('');
  const [supervisorEmail] = useState('supervisor@libertystationcourtyard.com');

  useEffect(() => {
    const loadData = async () => {
      try {
        const scoresResult = await window.storage.get('training-scores-v2', true);
        if (scoresResult?.value) setAllScores(JSON.parse(scoresResult.value));
        
        const manualResult = await window.storage.get('manual-completions', true);
        if (manualResult?.value) setManualCompletions(JSON.parse(manualResult.value));
        
        const sessionResult = await window.storage.get('training-session-v2', false);
        if (sessionResult?.value) {
          const session = JSON.parse(sessionResult.value);
          setUserName(session.name);
          setUserEmail(session.email);
          setIsLoggedIn(true);
          const userScoresResult = await window.storage.get(`scores-v2-${session.email}`, false);
          if (userScoresResult?.value) setUserScores(JSON.parse(userScoresResult.value));
        }
      } catch (e) { console.log('Storage init'); }
      setLoading(false);
    };
    loadData();
  }, []);

  const saveScore = async (moduleId, scorePercent) => {
    const timestamp = new Date().toISOString();
    const newUserScores = { ...userScores, [moduleId]: { score: scorePercent, date: timestamp, attempts: (userScores[moduleId]?.attempts || 0) + 1, type: 'quiz' } };
    setUserScores(newUserScores);
    try { await window.storage.set(`scores-v2-${userEmail}`, JSON.stringify(newUserScores), false); } catch (e) {}
    
    const newAllScores = { ...allScores };
    if (!newAllScores[userEmail]) newAllScores[userEmail] = { name: userName, modules: {} };
    newAllScores[userEmail].modules[moduleId] = { score: scorePercent, date: timestamp, type: 'quiz' };
    setAllScores(newAllScores);
    try { await window.storage.set('training-scores-v2', JSON.stringify(newAllScores), true); } catch (e) {}
  };

  const markManualComplete = async (email, name, moduleId) => {
    const timestamp = new Date().toISOString();
    const newManual = { ...manualCompletions, [`${email}-${moduleId}`]: { completedBy: userName, date: timestamp, type: 'hands-on' } };
    setManualCompletions(newManual);
    try { await window.storage.set('manual-completions', JSON.stringify(newManual), true); } catch (e) {}
    
    const newAllScores = { ...allScores };
    if (!newAllScores[email]) newAllScores[email] = { name: name, modules: {} };
    newAllScores[email].modules[moduleId] = { score: 100, date: timestamp, type: 'hands-on' };
    setAllScores(newAllScores);
    try { await window.storage.set('training-scores-v2', JSON.stringify(newAllScores), true); } catch (e) {}
    
    alert(`✓ Marked ${name} as complete for ${modules.find(m => m.id === moduleId)?.title}`);
  };

  const handleLogin = async () => {
    if (userName.trim() && userEmail.trim()) {
      setIsLoggedIn(true);
      try {
        await window.storage.set('training-session-v2', JSON.stringify({ name: userName, email: userEmail }), false);
        const result = await window.storage.get(`scores-v2-${userEmail}`, false);
        if (result?.value) setUserScores(JSON.parse(result.value));
      } catch (e) {}
    }
  };

  const startQuiz = (module) => {
    setCurrentModule(module);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setCurrentView('quiz');
  };

  const handleAnswer = (index) => { if (!showResult) setSelectedAnswer(index); };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    if (selectedAnswer === currentModule.questions[currentQuestion].correct) setScore(score + 1);
  };

  const nextQuestion = () => {
    if (currentQuestion < currentModule.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const finalScore = Math.round(((score + (selectedAnswer === currentModule.questions[currentQuestion].correct ? 1 : 0)) / currentModule.questions.length) * 100);
      saveScore(currentModule.id, finalScore);
      setQuizComplete(true);
    }
  };

  const sendEmailReport = () => {
    const finalScore = Math.round((score / currentModule.questions.length) * 100);
    const passed = finalScore >= 80;
    const subject = encodeURIComponent(`Training: ${currentModule.title} - ${userName} - ${passed ? 'PASSED' : 'NEEDS REVIEW'}`);
    const body = encodeURIComponent(`TRAINING MODULE COMPLETION REPORT\n================================\n\nAssociate: ${userName}\nEmail: ${userEmail}\nModule: ${currentModule.title}\nDate: ${new Date().toLocaleDateString()}\nTime: ${new Date().toLocaleTimeString()}\n\nRESULTS\n-------\nScore: ${score}/${currentModule.questions.length} (${finalScore}%)\nStatus: ${passed ? '✓ PASSED' : '✗ NEEDS REVIEW'}\n\n${passed ? 'This associate has successfully completed this training module.' : 'This associate should review the material and retake the quiz.'}\n\n---\nCourtyard by Marriott Liberty Station\nFront Desk Training Portal`);
    window.open(`mailto:${supervisorEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  const getUserProgress = () => {
    const passed = modules.filter(m => {
      const quizScore = userScores[m.id]?.score >= 80;
      const manualComplete = manualCompletions[`${userEmail}-${m.id}`];
      return quizScore || manualComplete;
    }).length;
    return { passed, total: modules.length };
  };

  const getLeaderboard = () => {
    const users = {};
    Object.entries(allScores).forEach(([email, data]) => {
      users[email] = { name: data.name, email, modules: { ...data.modules } };
    });
    Object.entries(manualCompletions).forEach(([key, data]) => {
      const [email, moduleId] = key.split('-');
      const name = allScores[email]?.name || email.split('@')[0];
      if (!users[email]) users[email] = { name, email, modules: {} };
      if (!users[email].modules[moduleId] || users[email].modules[moduleId].score < 100) {
        users[email].modules[moduleId] = { score: 100, date: data.date, type: 'hands-on' };
      }
    });
    return Object.values(users).map(user => {
      const moduleScores = Object.values(user.modules);
      const avgScore = moduleScores.length > 0 ? Math.round(moduleScores.reduce((a, b) => a + b.score, 0) / moduleScores.length) : 0;
      const completedCount = moduleScores.filter(m => m.score >= 80).length;
      return { ...user, avgScore, completed: completedCount };
    }).sort((a, b) => b.completed - a.completed || b.avgScore - a.avgScore);
  };

  const categories = [...new Set(modules.map(m => m.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Training Portal...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🏨</div>
            <h1 className="text-2xl font-bold text-gray-800">Front Desk Training Portal</h1>
            <p className="text-gray-500 mt-2">Courtyard by Marriott Liberty Station</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="your.email@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={handleLogin} disabled={!userName.trim() || !userEmail.trim()} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400">
              Start Training
            </button>
          </div>
        </div>
      </div>
    );
  }

  const NavBar = () => (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🏨</span>
            <span className="font-bold text-lg hidden sm:block">FD Training</span>
          </div>
          <div className="hidden md:flex items-center space-x-1">
            {[['home', Home, 'Modules'], ['progress', BarChart3, 'Progress'], ['leaderboard', Trophy, 'Leaderboard'], ['matrix', Users, 'Matrix'], ['manager', Shield, 'Manager']].map(([view, Icon, label]) => (
              <button key={view} onClick={() => setCurrentView(view)} className={`px-3 py-2 rounded-lg transition text-sm ${currentView === view ? 'bg-blue-700' : 'hover:bg-blue-800'}`}>
                <Icon size={16} className="inline mr-1" />{label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <User size={16} /><span>{userName.split(' ')[0]}</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {[['home', 'Modules'], ['progress', 'Progress'], ['leaderboard', 'Leaderboard'], ['matrix', 'Matrix'], ['manager', 'Manager']].map(([view, label]) => (
              <button key={view} onClick={() => { setCurrentView(view); setMobileMenuOpen(false); }} className="block w-full text-left px-4 py-2 rounded-lg hover:bg-blue-800">{label}</button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );

  // HOME VIEW
  if (currentView === 'home') {
    const progress = getUserProgress();
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome, {userName.split(' ')[0]}!</h2>
                <p className="text-gray-500">Complete all {modules.length} modules to become fully certified.</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{progress.passed}</div>
                  <div className="text-xs text-gray-500">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-400">{progress.total - progress.passed}</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all" style={{ width: `${(progress.passed / progress.total) * 100}%` }} />
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round((progress.passed / progress.total) * 100)}% Complete</p>
            </div>
          </div>

          {categories.map(category => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {modules.filter(m => m.category === category).map((module) => {
                  const quizScore = userScores[module.id];
                  const manualComplete = manualCompletions[`${userEmail}-${module.id}`];
                  const passed = quizScore?.score >= 80 || manualComplete;
                  const isHandsOn = manualComplete && !quizScore;
                  return (
                    <div key={module.id} className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden">
                      <div className={`${module.color} p-3 text-white`}>
                        <div className="flex justify-between items-start">
                          <span className="text-2xl">{module.icon}</span>
                          {(quizScore || manualComplete) && (
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${passed ? 'bg-green-500' : 'bg-yellow-500'}`}>
                              {isHandsOn ? '✓ H/O' : `${quizScore?.score}%`}
                            </span>
                          )}
                        </div>
                        <h4 className="font-semibold mt-2 text-sm leading-tight">{module.title}</h4>
                      </div>
                      <div className="p-3">
                        <p className="text-gray-600 text-xs mb-3">{module.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400">{module.questions.length} Q</span>
                          <button onClick={() => startQuiz(module)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${passed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                            {passed ? 'Retake' : quizScore ? 'Retry' : 'Start'}
                            <ChevronRight size={14} className="inline ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // QUIZ VIEW
  if (currentView === 'quiz' && currentModule) {
    if (quizComplete) {
      const finalScore = Math.round((score / currentModule.questions.length) * 100);
      const passed = finalScore >= 80;
      return (
        <div className="min-h-screen bg-gray-100">
          <NavBar />
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${passed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {passed ? <CheckCircle size={40} className="text-green-600" /> : <XCircle size={40} className="text-yellow-600" />}
              </div>
              <h2 className="text-2xl font-bold mt-4">{passed ? 'Congratulations!' : 'Keep Learning!'}</h2>
              <p className="text-gray-600 mt-1 text-sm">{currentModule.title}</p>
              <div className="my-6">
                <div className="text-5xl font-bold text-gray-800">{finalScore}%</div>
                <div className="text-gray-500">Score: {score}/{currentModule.questions.length}</div>
              </div>
              <div className={`p-4 rounded-lg ${passed ? 'bg-green-50' : 'bg-yellow-50'} mb-6`}>
                <p className={passed ? 'text-green-700' : 'text-yellow-700'}>
                  {passed ? '✓ You have passed! Great job!' : '⚠ Score 80% or higher to pass.'}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={sendEmailReport} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center">
                  <Mail size={16} className="mr-2" />Email Results
                </button>
                <button onClick={() => setCurrentView('home')} className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">
                  Back to Modules
                </button>
              </div>
              {!passed && (
                <button onClick={() => startQuiz(currentModule)} className="mt-3 px-5 py-2.5 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition">
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    const question = currentModule.questions[currentQuestion];
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="truncate mr-2">{currentModule.title}</span>
              <span className="whitespace-nowrap">Q {currentQuestion + 1}/{currentModule.questions.length}</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 transition-all" style={{ width: `${((currentQuestion + 1) / currentModule.questions.length) * 100}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">{question.q}</h3>
            <div className="space-y-2">
              {question.options.map((option, index) => {
                let btnClass = 'w-full p-3 text-left rounded-lg border-2 transition text-sm ';
                if (showResult) {
                  if (index === question.correct) btnClass += 'border-green-500 bg-green-50 text-green-800';
                  else if (index === selectedAnswer) btnClass += 'border-red-500 bg-red-50 text-red-800';
                  else btnClass += 'border-gray-200 text-gray-400';
                } else if (selectedAnswer === index) btnClass += 'border-blue-500 bg-blue-50';
                else btnClass += 'border-gray-200 hover:border-blue-300 hover:bg-blue-50';
                return (
                  <button key={index} onClick={() => handleAnswer(index)} disabled={showResult} className={btnClass}>
                    <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>{option}
                    {showResult && index === question.correct && <CheckCircle size={18} className="float-right text-green-600" />}
                    {showResult && index === selectedAnswer && index !== question.correct && <XCircle size={18} className="float-right text-red-600" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex justify-between">
              <button onClick={() => setCurrentView('home')} className="px-3 py-2 text-gray-600 hover:text-gray-800 text-sm">
                <ChevronLeft size={16} className="inline" />Exit
              </button>
              {!showResult ? (
                <button onClick={submitAnswer} disabled={selectedAnswer === null} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 text-sm">
                  Submit
                </button>
              ) : (
                <button onClick={nextQuestion} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition text-sm">
                  {currentQuestion < currentModule.questions.length - 1 ? 'Next' : 'Results'}<ChevronRight size={16} className="inline ml-1" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // PROGRESS VIEW
  if (currentView === 'progress') {
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-5xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">My Progress</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Module</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Score</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {modules.map((module) => {
                    const quizScore = userScores[module.id];
                    const manualComplete = manualCompletions[`${userEmail}-${module.id}`];
                    const passed = quizScore?.score >= 80 || manualComplete;
                    return (
                      <tr key={module.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-xl mr-2">{module.icon}</span>
                            <span className="font-medium text-gray-800">{module.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {quizScore ? (<span className={`text-lg font-bold ${passed ? 'text-green-600' : 'text-yellow-600'}`}>{quizScore.score}%</span>)
                            : manualComplete ? (<span className="text-green-600 font-bold">100%</span>)
                            : (<span className="text-gray-400">—</span>)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {passed ? (<span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">✓ Passed</span>)
                            : quizScore ? (<span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Review</span>)
                            : (<span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">Not Started</span>)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {manualComplete && !quizScore ? (<span className="text-xs text-purple-600">Hands-On</span>)
                            : quizScore ? (<span className="text-xs text-blue-600">Quiz</span>)
                            : (<span className="text-xs text-gray-400">—</span>)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => startQuiz(module)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700">
                            {quizScore || manualComplete ? 'Retake' : 'Start'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LEADERBOARD VIEW
  if (currentView === 'leaderboard') {
    const leaderboard = getLeaderboard();
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"><Trophy className="inline mr-2 text-yellow-500" />Team Leaderboard</h2>
          {leaderboard.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No scores yet!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">Rank</th>
                    <th className="px-4 py-3 text-left">Associate</th>
                    <th className="px-4 py-3 text-center">Modules</th>
                    <th className="px-4 py-3 text-center">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((user, index) => (
                    <tr key={user.email} className={`hover:bg-gray-50 ${user.email === userEmail ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : <span className="text-gray-500">{index + 1}</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold">{user.name}{user.email === userEmail && <span className="ml-1 text-xs text-blue-600">(You)</span>}</td>
                      <td className="px-4 py-3 text-center"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-semibold">{user.completed}/{modules.length}</span></td>
                      <td className="px-4 py-3 text-center font-bold" style={{ color: user.avgScore >= 80 ? '#16a34a' : '#ca8a04' }}>{user.avgScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MATRIX VIEW
  if (currentView === 'matrix') {
    const leaderboard = getLeaderboard();
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-full mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"><Users className="inline mr-2 text-blue-600" />Training Matrix</h2>
          {leaderboard.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No data yet!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="text-xs">
                  <thead>
                    <tr className="bg-blue-900 text-white">
                      <th className="px-3 py-2 text-left font-semibold sticky left-0 bg-blue-900 z-10 min-w-[120px]">Associate</th>
                      {modules.map(m => (
                        <th key={m.id} className="px-1 py-2 text-center font-semibold min-w-[50px]" title={m.title}>
                          <div className="text-base">{m.icon}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaderboard.map((user) => (
                      <tr key={user.email} className={user.email === userEmail ? 'bg-blue-50' : ''}>
                        <td className="px-3 py-2 font-semibold text-gray-800 sticky left-0 bg-white z-10 border-r whitespace-nowrap">
                          {user.name.split(' ')[0]}
                        </td>
                        {modules.map(m => {
                          const moduleData = user.modules[m.id];
                          const score = moduleData?.score;
                          const isHandsOn = moduleData?.type === 'hands-on';
                          let cellClass = 'px-1 py-2 text-center ';
                          let content;
                          if (score !== undefined) {
                            if (score >= 80) {
                              cellClass += 'bg-green-100';
                              content = <span className="text-green-700 font-bold">{isHandsOn ? '✓' : score}</span>;
                            } else {
                              cellClass += 'bg-yellow-100';
                              content = <span className="text-yellow-700 font-bold">{score}</span>;
                            }
                          } else {
                            cellClass += 'bg-red-50';
                            content = <span className="text-red-300">—</span>;
                          }
                          return <td key={m.id} className={cellClass}>{content}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t flex flex-wrap gap-3 text-xs">
                <div className="flex items-center"><div className="w-4 h-4 bg-green-100 rounded mr-1"></div>Passed (≥80%)</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-yellow-100 rounded mr-1"></div>In Progress</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-red-50 rounded mr-1"></div>Not Started</div>
                <div className="flex items-center"><span className="text-green-700 font-bold mr-1">✓</span>Hands-On Complete</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // MANAGER VIEW
  if (currentView === 'manager') {
    const leaderboard = getLeaderboard();
    return (
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4"><Shield className="inline mr-2 text-purple-600" />Training Manager</h2>
          
          {!managerUnlocked ? (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <Lock size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold">Manager Access Required</h3>
                <p className="text-gray-500 text-sm">Enter PIN to mark modules complete via hands-on training</p>
              </div>
              <div className="max-w-xs mx-auto">
                <input
                  type="password"
                  value={managerPin}
                  onChange={(e) => setManagerPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest mb-4"
                  maxLength={4}
                />
                <button
                  onClick={() => {
                    if (managerPin === MANAGER_PIN) {
                      setManagerUnlocked(true);
                      setManagerPin('');
                    } else {
                      alert('Incorrect PIN');
                      setManagerPin('');
                    }
                  }}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700"
                >
                  Unlock
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Mark Hands-On Complete</h3>
                <button onClick={() => setManagerUnlocked(false)} className="text-sm text-gray-500 hover:text-gray-700">
                  <Lock size={16} className="inline mr-1" />Lock
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Employee</label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choose an employee...</option>
                    {leaderboard.map(user => (
                      <option key={user.email} value={`${user.email}|${user.name}`}>{user.name}</option>
                    ))}
                    <option value="new">+ Add New Employee</option>
                  </select>
                </div>
                
                {selectedEmployee === 'new' && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                    <input type="text" placeholder="Employee Name" id="newEmpName" className="w-full px-3 py-2 border rounded-lg" />
                    <input type="email" placeholder="Employee Email" id="newEmpEmail" className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Module</label>
                  <select
                    value={selectedModuleToComplete}
                    onChange={(e) => setSelectedModuleToComplete(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                  >
                    <option value="">Choose a module...</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.icon} {m.title}</option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={() => {
                    let email, name;
                    if (selectedEmployee === 'new') {
                      name = document.getElementById('newEmpName')?.value;
                      email = document.getElementById('newEmpEmail')?.value;
                      if (!name || !email) return alert('Please enter name and email');
                    } else if (selectedEmployee) {
                      [email, name] = selectedEmployee.split('|');
                    } else {
                      return alert('Please select an employee');
                    }
                    if (!selectedModuleToComplete) return alert('Please select a module');
                    markManualComplete(email, name, selectedModuleToComplete);
                    setSelectedEmployee('');
                    setSelectedModuleToComplete('');
                  }}
                  disabled={!selectedModuleToComplete || (!selectedEmployee)}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                >
                  <Award size={18} className="mr-2" />
                  Mark as Complete (Hands-On)
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <strong>Hands-On Training:</strong> Use this to certify an associate when you've personally observed them demonstrate competency, in lieu of the online quiz.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
