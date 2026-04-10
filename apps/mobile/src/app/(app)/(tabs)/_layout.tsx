import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '项目',
          tabBarLabel: '项目',
        }}
      />
      <Tabs.Screen
        name="my-work"
        options={{
          title: '我的工作',
          tabBarLabel: '我的',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '个人中心',
          tabBarLabel: '我',
        }}
      />
    </Tabs>
  );
}
