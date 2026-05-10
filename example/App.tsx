import AwesomeAppIcon from 'expo-awesome-app-icon';
import { Button, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function App() {
  const availableIcons = AwesomeAppIcon.getAvailableIcons();
  const currentIcon = AwesomeAppIcon.getAppIcon();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Dynamic App Icon Example</Text>
        <Group name="Support">
          <Text>{AwesomeAppIcon.supportsAlternateIcons() ? 'Supported' : 'Not supported'}</Text>
        </Group>
        <Group name="Current icon">
          <Text>{currentIcon ?? 'Primary'}</Text>
        </Group>
        <Group name="Configured icons">
          <Text>{availableIcons.length > 0 ? availableIcons.join(', ') : 'None'}</Text>
        </Group>
        {availableIcons.map((iconName) => (
          <Group key={iconName} name={iconName}>
            <Button title={`Use ${iconName}`} onPress={() => AwesomeAppIcon.setAppIcon(iconName)} />
          </Group>
        ))}
        <Group name="Primary">
          <Button
            title="Reset to primary icon"
            onPress={() => AwesomeAppIcon.setAppIcon(null)}
          />
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = {
  header: {
    fontSize: 30,
    margin: 20,
  },
  groupHeader: {
    fontSize: 20,
    marginBottom: 20,
  },
  group: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#eee',
  },
};
