import { TrsutData } from '@/lib/constentData'
import { Image, StyleSheet, View, Text } from '@react-pdf/renderer'
import React from 'react'

const RED   = '#c0392b';
const NAVY  = '#1a3a6e';
const GOLD  = '#c8971e';
const DARK  = '#1a1a1a';

const styles = StyleSheet.create({
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: GOLD,
    borderBottomStyle: 'solid',
    paddingBottom: 6,
    marginBottom: 8,
  },
  logo: {
    width: 52,
    height: 52,
    marginRight: 10,
  },
  centerView: {
    flex: 1,
    alignItems: 'center',
  },
  orgTitle: {
    fontFamily: 'NotoSansDevanagari',
    fontWeight: 'bold',
    fontSize: 20,
    color: RED,
    letterSpacing: 0.5,
  },
  subText: {
    fontFamily: 'NotoSansDevanagari',
    fontSize: 8.5,
    color: DARK,
    marginTop: 2,
  },
  regText: {
    fontFamily: 'NotoSansDevanagari',
    fontSize: 8,
    color: NAVY,
    marginTop: 1,
  }
})

const PdfHeaderCom = ({ height }) => {
  return (
    <View style={styles.headerSection}>
      <Image src={TrsutData.logo} style={styles.logo} />
      <View style={styles.centerView}>
        <Text style={styles.orgTitle}>{TrsutData.name}</Text>
        <Text style={styles.subText}>कार्यालय पता : {TrsutData.address}</Text>
        <Text style={styles.subText}>सम्पर्क सूत्र : कार्यालय न. {TrsutData.contact}</Text>
        <Text style={styles.regText}>रजिस्ट्रेशन नंबर :- {TrsutData.regNo}</Text>
      </View>
    </View>
  )
}

export default PdfHeaderCom