// lib/features/counter/counterSlice.js
import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_YOJNAS = [
  {
    id: 'prog_vivah_1',
    name: 'पुत्र-पुत्री विवाह योजना',
    hiname: 'पुत्र-पुत्री विवाह योजना',
    englishName: 'Son-Daughter Marriage Scheme',
    about: 'पुत्र एवं पुत्री के विवाह हेतु आर्थिक सहायता एवं समाज सहयोग योजना।',
    noteLine: 'वीर बालाजी फाउंडेशन - पुत्र-पुत्री विवाह योजना',
    category: 'isVivah',
    isVivah: true,
    isMamera: false,
    isSuraksha: false,
    isOther: false,
    memberCount: 0,
    inactivemembercount: 0,
    ageGroups: [
      { id: 'ag_v1', startAge: 5, endAge: 10, joinFee: 2100, payAmount: 100 },
      { id: 'ag_v2', startAge: 11, endAge: 15, joinFee: 5100, payAmount: 200 },
      { id: 'ag_v3', startAge: 16, endAge: 21, joinFee: 11000, payAmount: 300 },
      { id: 'ag_v4', startAge: 21, endAge: 100, joinFee: 11500, payAmount: 300 }
    ],
    locationGroups: [
      { id: 'loc_1', location: 'राजस्थान', groupName: 'Group A', groupType: 'A' },
      { id: 'loc_2', location: 'गुजरात', groupName: 'Group B', groupType: 'B' }
    ],
    createdAt: new Date().toISOString(),
    isSelected: true
  },
  {
    id: 'prog_mayra_1',
    name: 'मायरा योजना',
    hiname: 'मायरा योजना',
    englishName: 'Mayra Scheme',
    about: 'मायरा एवं सामाजिक अवसरों पर आर्थिक एवं सामाजिक सहयोग योजना।',
    noteLine: 'वीर बालाजी फाउंडेशन - मायरा योजना',
    category: 'isMamera',
    isVivah: false,
    isMamera: true,
    isSuraksha: false,
    isOther: false,
    memberCount: 0,
    inactivemembercount: 0,
    ageGroups: [
      { id: 'ag_m1', startAge: 5, endAge: 10, joinFee: 2100, payAmount: 100 },
      { id: 'ag_m2', startAge: 11, endAge: 15, joinFee: 5100, payAmount: 200 },
      { id: 'ag_m3', startAge: 16, endAge: 21, joinFee: 11000, payAmount: 400 },
      { id: 'ag_m4', startAge: 21, endAge: 100, joinFee: 11500, payAmount: 500 }
    ],
    locationGroups: [
      { id: 'loc_m1', location: 'राजस्थान', groupName: 'Group A', groupType: 'A' },
      { id: 'loc_m2', location: 'गुजरात', groupName: 'Group B', groupType: 'B' }
    ],
    createdAt: new Date().toISOString(),
    isSelected: false
  },
  {
    id: 'prog_suraksha_1',
    name: 'सुरक्षा सहयोग योजना',
    hiname: 'सुरक्षा सहयोग योजना',
    englishName: 'Suraksha Sahyog Scheme',
    about: 'सदस्यों एवं परिवारों हेतु आपातकालीन सुरक्षा एवं आर्थिक सहायता योजना।',
    noteLine: 'वीर बालाजी फाउंडेशन - सुरक्षा सहयोग योजना',
    category: 'isSuraksha',
    isVivah: false,
    isMamera: false,
    isSuraksha: true,
    isOther: false,
    memberCount: 0,
    inactivemembercount: 0,
    ageGroups: [
      { id: 'ag_s1', startAge: 40, endAge: 50, joinFee: 2100, payAmount: 100 },
      { id: 'ag_s2', startAge: 51, endAge: 60, joinFee: 5100, payAmount: 200 },
      { id: 'ag_s3', startAge: 61, endAge: 70, joinFee: 11000, payAmount: 300 },
      { id: 'ag_s4', startAge: 71, endAge: 100, joinFee: 11500, payAmount: 350 }
    ],
    locationGroups: [
      { id: 'loc_s1', location: 'राजस्थान', groupName: 'Group A', groupType: 'A' },
      { id: 'loc_s2', location: 'गुजरात', groupName: 'Group B', groupType: 'B' }
    ],
    createdAt: new Date().toISOString(),
    isSelected: false
  }
];

const initialState = {
  programList: DEFAULT_YOJNAS,
  selectedProgram: DEFAULT_YOJNAS[0],
  agentsList: [],
  getAgentDataChange: false,
  getMemberDataChange: false
};

export const commonSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setPrograms: (state, action) => {
      state.programList = action.payload;
    },
    setSelectedProgram: (state, action) => {
      state.selectedProgram = action.payload;
    },
    setAgentList: (state, action) => {
      state.agentsList = action.payload;
    },
        setgetAgentDataChange(state,action){
      state.getAgentDataChange=action.payload
    },
    setgetMemberDataChange(state,action){
      state.getMemberDataChange=action.payload
    }
  },
});

// Action creators are generated for each case reducer function
export const { setPrograms,setSelectedProgram ,setAgentList,setgetAgentDataChange,setgetMemberDataChange} = commonSlice.actions;

export default commonSlice.reducer;