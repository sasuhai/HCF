# RESTRUCTURED: Monthly Class Information System

## Overview
**IMPORTANT CHANGE**: The class additional information system has been restructured to store data **per month**, not per class. This allows class details (bahasa, hariMasa, penaja, kekerapan, pic, noTelPIC, catatan) to vary each month as needed.

## What Changed

### ❌ Previous Structure (Removed)
- Class information fields were stored in the `classes` collection
- Data was fixed for each class
- Could not vary month-to-month

### ✅ New Structure (Current)
- Class information fields are stored in the `attendance_records` collection
- Data is specific to each class+month combination  
- Can be edited separately for each month
- Synced with the selected month and class on the kehadiran page

## Data Storage

### Firestore `attendance_records` Collection
Each document ID format: `{classId}_{YYYY-MM}`

```javascript
{
  id: "class123_2026-02",
  classId: "class123",
  month: "2026-02",
  workers: [...],
  students: [...],
  
  // Monthly Class Information (NEW)
  bahasa: "Bahasa Melayu",      // Language
  hariMasa: "Ahad 8-10PM",       // Day & Time
  penaja: "Lembaga Zakat",       // Sponsor
  kekerapan: "Mingguan",         // Frequency
  pic: "Ustaz Ahmad",            // Person in charge
  noTelPIC: "012-3456789",       // PIC phone
  catatan: "Special notes...",   // Notes/remarks
  
  updatedAt: Timestamp
}
```

## Files Modified

### 1. `/app/kelas/page.js` - Class Management
**Changes:**
- ✅ Removed monthly-specific fields from class form
- ✅ Reverted formData state to original (nama, lokasi, jenis, tahap only)
- ✅ Removed "Maklumat Tambahan Kelas" section
- ✅ Reverted modal to original size (max-w-lg)

**Result:** Clean class management focused on permanent class properties only.

### 2. `/app/kehadiran/page.js` - Attendance Page
**Major Changes:**

#### A. State Management
- ✅ Added `isClassInfoModalOpen` state
- ✅ Added `classInfoForm` state with all 7 fields
- ✅ Added `openClassInfoModal()` function
- ✅ Added `handleSaveClassInfo()` function
- ✅ Added `Edit2` icon import

#### B. Data Initialization
- ✅ Updated attendance record initialization to include default monthly class info:
  ```javascript
  {
    workers: [],
    students: [],
    bahasa: 'Bahasa Melayu',
    hariMasa: '',
    penaja: '',
    kekerapan: 'Mingguan',
    pic: '',
    noTelPIC: '',
    catatan: ''
  }
  ```

#### C. Display Card
- ✅ Updated class information card to show data from `attendanceRecord` instead of `selectedClass`
- ✅ Added edit button (pencil icon) to card header
- ✅ Card only shows when both `selectedClassId` AND `attendanceRecord` are available
- ✅ All fields (bahasa, hariMasa, kekerapan, penaja, pic, noTelPIC, catatan) read from attendance record

#### D. Edit Modal
- ✅ Added comprehensive edit modal with all 7 fields
- ✅ Modal title: "Maklumat Kelas Bulanan"
- ✅ Scrollable modal (max-h-[90vh])
- ✅ All form fields with proper labels and placeholders
- ✅ Save and Cancel buttons
- ✅ Auto-populates with existing monthly data

## User Workflow

### Viewing Monthly Class Info
1. Navigate to **Kehadiran** page
2. Select **Lokasi**, **Kelas**, and **Bulan** (month)
3. Class information card appears showing monthly details
4. If no data exists, default values are shown

### Editing Monthly Class Info
1. On the kehadiran page, click the **Edit icon (pencil)** in the class info card
2. Modal opens titled "Maklumat Kelas Bulanan"
3. Edit any of the 7 fields:
   - **Bahasa** - Dropdown (Bahasa Melayu, English, 中文, தமிழ்)
   - **Hari & Masa** - Text input (e.g., "Ahad 8:00 PM - 10:00 PM")
   - **Kekerapan Kelas** - Dropdown (Harian, Mingguan, Dua Minggu Sekali, Bulanan)
   - **Penaja** - Text input (e.g., "Lembaga Zakat Selangor")
   - **PIC** - Text input (e.g., "Ustaz Ahmad bin Ali")
   - **No Tel PIC** - Tel input (e.g 012-3456789")
   - **Catatan** - Textarea for notes
4. Click **Simpan** to save
5. Modal closes and card updates immediately

### Month-to-Month Variation
**Example Scenario:**
- **January 2026**: 
  - Bahasa: Bahasa Melayu
  - Hari & Masa: Ahad 8:00 PM
  - PIC: Ustaz Ahmad
  
- **February 2026**:
  - Bahasa: English
  - Hari & Masa: Sabtu 2:00 PM
  - PIC: Ustazah Siti

Each month maintains its own independent data!

## Key Benefits

### ✅ Flexibility
- Different PIC each month
- Schedule changes handled easily
- Sponsor can vary per month
- Notes specific to each month

### ✅ Historical Tracking
- Complete audit trail of monthly variations
- Can review past month's information
- Data preserved in attendance records

### ✅ Real-time Sync
- Changes save immediately to Firestore
- Display updates without page refresh
- No conflicts between months

## Technical Implementation

### Data Flow
```
1. User selects Class & Month
2. Attendance record loads (or creates new with defaults)
3. Class info card displays record.bahasa, record.hariMasa, etc.
4. User clicks Edit button
5. Modal opens, populates form from attendance record
6. User edits fields
7. Click Simpan → saveAttendance(classInfoForm)
8. Firestore updates attendance_records/{classId}_{month}
9. Real-time listener updates attendanceRecord state
10. Card display refreshes automatically
```

### Database Operations
- **Read**: Automatic via `onSnapshot` listener on attendance_records
- **Write**: Via `saveAttendance()` function with `serverTimestamp()`
- **Create**: Auto-initialized with defaults when new month selected
- **Update**: Merge operation preserves workers/students data

## Migration Notes

### Existing Data
- Old classes in `classes` collection are unaffected
- No migration needed - system creates monthly data on first use
- Previous class-level fields (if any existed) are ignored

### Firestore Security
Existing security rules for `attendance_records` apply:
- Read: All authenticated users
- Write: Based on user role and location access

## Testing Checklist

- [ ] Can view monthly class info when selecting class+month
- [ ] Edit button appears on class info card
- [ ] Can open edit modal
- [ ] Modal loads existing monthly data correctly
- [ ] Can edit all 7 fields
- [ ] Can save changes successfully
- [ ] Card updates immediately after save
- [ ] Different months for same class show different data
- [ ] New months initialize with default values
- [ ] Changes don't affect other months
- [ ] Workers/students data not affected by class info edits

## Future Enhancements

1. **Copy from previous month** - Button to copy last month's info as starting point
2. **Monthly history view** - See how class info has changed over time
3. **Bulk update** - Apply same info to multiple months
4. **Templates** - Save common configurations
5. **Validation** - Ensure PIC contact info is complete

---

**Implementation Date**: Feb 13, 2026  
**Status**: ✅ Complete  
**Architecture**: Monthly-based (per attendance record)  
**Developer**: Antigravity AI Assistant
