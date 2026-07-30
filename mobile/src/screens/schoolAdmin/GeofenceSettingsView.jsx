import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import * as Location from 'expo-location';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { QueryState } from '../../components/ui/QueryState';
import { Panel } from '../../components/ui/Panel';
import { IconWell } from '../../components/ui/IconWell';
import { useAppTheme } from '../../theme/ThemeProvider';
import { useGetGeofenceSettingsQuery, useUpdateGeofenceSettingsMutation } from '../../store/api/apiSlice';

/** Sets the school's GPS location + geofence radius that every staff member's self-attendance
 * check-in/out is validated against (selfAttendance.controllers.js). Location is captured from
 * the device's current position — meant to be set once while standing at the school. */
export function GeofenceSettingsView() {
  const { colors, typography, spacing } = useAppTheme();
  const { data, isLoading, isError, error, refetch } = useGetGeofenceSettingsQuery();
  const [updateGeofence, updateState] = useUpdateGeofenceSettingsMutation();

  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [radius, setRadius] = useState('200');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (data?.location) {
      setLat(data.location.lat ?? null);
      setLng(data.location.lng ?? null);
      setRadius(String(data.location.geofenceRadius ?? 200));
      setAddress(data.location.address ?? '');
    }
  }, [data]);

  const captureLocation = async () => {
    setMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission is required');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLat(position.coords.latitude);
      setLng(position.coords.longitude);
      setMessage({ text: 'Current location captured — review and save below', isError: false });
    } catch (err) {
      setMessage({ text: err.message || 'Failed to get location', isError: true });
    }
  };

  const handleSave = async () => {
    if (lat == null || lng == null) {
      setMessage({ text: 'Capture the school location first', isError: true });
      return;
    }
    try {
      await updateGeofence({ lat, lng, geofenceRadius: Number(radius) || 200, address: address.trim() }).unwrap();
      setMessage({ text: 'Geofence settings saved', isError: false });
      refetch();
    } catch (err) {
      setMessage({ text: err?.message || 'Failed to save', isError: true });
    }
  };

  return (
    <ScreenContainer scrollable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg }}>
        <IconWell icon="map-marker-radius-outline" color={colors.primary} size={44} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[typography.h2, { color: colors.text }]}>Geofence Settings</Text>
          <Text style={[typography.caption, { color: colors.textMuted, marginTop: 2 }]} numberOfLines={1}>
            School location used for self-attendance check-in validation
          </Text>
        </View>
      </View>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch} isEmpty={false}>
        <Panel>
          <Text style={[typography.h3, { color: colors.text, marginBottom: spacing.md }]}>{data?.name}</Text>

          <Text style={[typography.caption, { color: colors.textMuted, marginBottom: spacing.xs }]}>SCHOOL LOCATION</Text>
          <Text style={[typography.body, { color: colors.text, marginBottom: spacing.sm }]}>
            {lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'Not set yet'}
          </Text>
          <Button mode="outlined" icon="map-marker-outline" onPress={captureLocation} style={{ marginBottom: spacing.md }}>
            Capture Current Location
          </Button>

          <TextInput
            mode="outlined"
            label="Geofence Radius (metres)"
            value={radius}
            onChangeText={setRadius}
            keyboardType="numeric"
            style={{ marginBottom: spacing.md }}
          />
          <TextInput
            mode="outlined"
            label="Address (optional)"
            value={address}
            onChangeText={setAddress}
            style={{ marginBottom: spacing.md }}
          />

          {message && (
            <Text style={[typography.caption, { color: message.isError ? colors.danger : colors.success, marginBottom: spacing.md }]}>
              {message.text}
            </Text>
          )}

          <Button mode="contained" onPress={handleSave} loading={updateState.isLoading} disabled={updateState.isLoading}>
            Save Settings
          </Button>
        </Panel>
      </QueryState>
    </ScreenContainer>
  );
}
