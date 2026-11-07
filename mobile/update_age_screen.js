const fs = require('fs');
const path = '/Users/kirtishinde/Desktop/BlooMatrix/daarudoor/customer-app/src/screens/auth/AgeVerificationScreen.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace imports
content = content.replace(
  "import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';",
  "import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';\nimport DateTimePicker from '@react-native-community/datetimepicker';\nimport { TouchableOpacity } from 'react-native';"
);

// Replace state
content = content.replace(
  "const [day, setDay] = useState('');\n  const [month, setMonth] = useState('');\n  const [year, setYear] = useState('');",
  "const [dateOfBirth, setDateOfBirth] = useState<Date>(new Date(2000, 0, 1));\n  const [showDatePicker, setShowDatePicker] = useState(false);\n  const [isConfirmed, setIsConfirmed] = useState(false);"
);

// Replace handleSaveDOB
content = content.replace(
  /const handleSaveDOB = async \(\) => \{[\s\S]*?const dobStr = `\$\{y\}-\$\{m\.toString\(\)\.padStart\(2, '0'\)\}-\$\{d\.toString\(\)\.padStart\(2, '0'\)\}`;/m,
`const handleSaveDOB = async () => {
    setError('');

    if (!isConfirmed) {
      setError('Please confirm that the information is accurate.');
      return;
    }

    setLoading(true);
    try {
      const y = dateOfBirth.getFullYear();
      const m = dateOfBirth.getMonth() + 1;
      const d = dateOfBirth.getDate();
      const dobStr = \`\${y}-\${m.toString().padStart(2, '0')}-\${d.toString().padStart(2, '0')}\`;`
);

// Replace isButtonDisabled
content = content.replace(
  "const isButtonDisabled = !day || !month || year.length !== 4;",
  "const isButtonDisabled = !dateOfBirth || !isConfirmed;"
);

// Replace NOT_STARTED case render content
content = content.replace(
  /<Text style=\{styles\.cardTitle\}>Enter your Date Of Birth 🎉<\/Text>[\s\S]*?<\/View>\s*<\/View>/m,
  `<Text style={styles.cardTitle}>Enter your Date Of Birth 🎉</Text>
            
            <TouchableOpacity 
              style={styles.datePickerButton} 
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
              <Text style={styles.datePickerText}>
                {dateOfBirth.getDate().toString().padStart(2, '0')} / {(dateOfBirth.getMonth() + 1).toString().padStart(2, '0')} / {dateOfBirth.getFullYear()}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (selectedDate) setDateOfBirth(selectedDate);
                }}
              />
            )}

            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => setIsConfirmed(!isConfirmed)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={isConfirmed ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={isConfirmed ? colors.primary : colors.muted} 
              />
              <Text style={styles.checkboxText}>I confirm that the information provided is accurate.</Text>
            </TouchableOpacity>`
);

// Add styles
content = content.replace(
  "dateInputs: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, gap: 12 },",
  "dateInputs: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20, gap: 12 },\n    datePickerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },\n    datePickerText: { color: colors.text, fontSize: 16, fontWeight: '600', marginLeft: 10, letterSpacing: 2 },\n    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingRight: 10 },\n    checkboxText: { color: colors.muted, fontSize: 13, marginLeft: 10, flex: 1, lineHeight: 20 },"
);

// Replace titles
content = content.replace(
  "<Text style={styles.title}>Before you place an alcohol order...</Text>",
  "<Text style={styles.title}>Age Verification</Text>"
);
content = content.replace(
  "<Text style={styles.subtitle}>Because DaaruDoor delivers age-restricted products, we need to verify your age before you can place an eligible order.</Text>",
  "<Text style={styles.subtitle}>You must meet the legal minimum age requirement to use DaaruDoor.</Text>"
);

// handleFinish to Main instead of goBack
content = content.replace(
  "navigation.goBack(); // Or wherever checkout is",
  "navigation.replace('Main');"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
