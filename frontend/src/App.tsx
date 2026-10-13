import React, { useEffect, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LiveCameraPanel } from './components/LiveCameraPanel';
import { CurrentGesturePanel } from './components/CurrentGesturePanel';
import { GestureControls } from './components/GestureControls';
import { RecentActivity } from './components/RecentActivity';
import { SystemControls } from './components/SystemControls';
import { QuickSettings } from './components/QuickSettings';
import { CalibrationDialog } from './components/CalibrationDialog';
import { GesturesPage } from './pages/GesturesPage';
import { SettingsPage } from './pages/SettingsPage';

import {
  wsService,
  fetchConfig,
  updateConfig,
  fetchCameras,
  selectCamera,
  togglePauseApi,
  updateCalibrationApi,
  clearActivityApi,
} from './services/api';

import type { SystemTelemetry, BackendStatus, AppConfig, CameraDevice } from './types';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<string>('control');
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('Connecting');
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);

  // Load initial backend config and camera list
  const loadInitialData = useCallback(async () => {
    try {
      const [cfg, camList] = await Promise.all([fetchConfig(), fetchCameras()]);
      setConfig(cfg);
      setCameras(camList);
    } catch (e) {
      console.warn('[AirControl] Initial fetch error:', e);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
    wsService.connect();

    const unsubStatus = wsService.onStatusChange((status) => {
      setBackendStatus(status);
      if (status === 'Connected') {
        loadInitialData();
      }
    });

    const unsubTelemetry = wsService.onTelemetry((data) => {
      setTelemetry(data);
      // Home gesture reset trigger automatically switches tab back to Control Center
      if (data?.gesture?.action === 'HOME_RESET') {
        setActivePage('control');
      }
    });

    return () => {
      unsubStatus();
      unsubTelemetry();
    };
  }, [loadInitialData]);

  // Global Spacebar shortcut for Pause/Resume
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'SELECT') {
        e.preventDefault();
        handleTogglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [telemetry]);

  const handleTogglePause = async () => {
    try {
      const res = await togglePauseApi();
      if (telemetry) {
        setTelemetry({
          ...telemetry,
          system: { ...telemetry.system, paused: res.paused },
        });
      }
    } catch (e) {
      console.error('Failed to toggle pause state:', e);
    }
  };

  const handleSelectCamera = async (deviceId: number) => {
    try {
      await selectCamera(deviceId);
      await loadInitialData();
    } catch (e) {
      console.error('Failed to select camera:', e);
    }
  };

  const handleUpdateConfig = async (updated: Partial<AppConfig>) => {
    try {
      const result = await updateConfig(updated);
      setConfig(result);
    } catch (e) {
      console.error('Failed to update config:', e);
    }
  };

  const handleToggleGesture = async (id: string, enabled: boolean) => {
    if (!config) return;
    const keyMap: Record<string, string> = {
      cursor: 'cursor',
      click: 'click',
      drag: 'drag',
      scroll: 'scroll',
      volume: 'volume',
      home: 'home',
    };
    const key = keyMap[id];
    if (key) {
      await handleUpdateConfig({
        gestures: { ...config.gestures, [key]: enabled },
      });
    }
  };

  const handleSaveCalibration = async (bounds: { x_min: number; x_max: number; y_min: number; y_max: number }) => {
    try {
      await updateCalibrationApi(bounds);
      await loadInitialData();
    } catch (e) {
      console.error('Failed to save calibration:', e);
    }
  };

  const handleClearActivity = async () => {
    try {
      await clearActivityApi();
      if (telemetry) {
        setTelemetry({ ...telemetry, activity: [] });
      }
    } catch (e) {
      console.error('Failed to clear activity:', e);
    }
  };

  const isPaused = telemetry?.system?.paused ?? false;
  const cameraData = telemetry?.camera ?? null;
  const handData = telemetry?.hand ?? null;
  const gestureData = telemetry?.gesture ?? null;
  const gesturesList = telemetry?.gestures ?? [
    { id: 'cursor', name: 'Index Finger', action: 'Move Cursor', enabled: config?.gestures?.cursor ?? true },
    { id: 'click', name: 'Pinch', action: 'Left Click', enabled: config?.gestures?.click ?? true },
    { id: 'drag', name: 'Pinch + Move', action: 'Drag & Drop', enabled: config?.gestures?.drag ?? true },
    { id: 'scroll', name: 'Two Fingers', action: 'Scroll', enabled: config?.gestures?.scroll ?? true },
    { id: 'volume', name: 'Thumb Up / Down', action: 'Volume Control', enabled: config?.gestures?.volume ?? true },
    { id: 'home', name: 'Open Palm', action: 'Home / Reset UI', enabled: config?.gestures?.home ?? true },
  ];
  const activityList = telemetry?.activity ?? [];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header
        backendStatus={backendStatus}
        isPaused={isPaused}
        camera={cameraData}
        activePage={activePage}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onSelectPage={setActivePage}
          camera={cameraData}
          backendStatus={backendStatus}
          onRefreshCamera={() => loadInitialData()}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0b0f19] to-[#0f172a]/90">
          {activePage === 'control' && (
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
              {/* Top Row: Live Feed (left) & Current Gesture / Activity (right) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <LiveCameraPanel
                    camera={cameraData}
                    hand={handData}
                    backendStatus={backendStatus}
                    onRefresh={loadInitialData}
                  />
                </div>

                <div className="space-y-6 flex flex-col justify-between">
                  <CurrentGesturePanel gesture={gestureData} />
                  <RecentActivity activity={activityList} onClear={handleClearActivity} />
                </div>
              </div>

              {/* Middle Row: Gesture Controls Cards */}
              <GestureControls
                gestures={gesturesList}
                currentGesture={gestureData}
                onToggleGesture={handleToggleGesture}
              />

              {/* System Action Controls */}
              <SystemControls
                isPaused={isPaused}
                config={config}
                onTogglePause={handleTogglePause}
                onOpenCalibration={() => setIsCalibrationOpen(true)}
                onToggleStartup={(enabled) =>
                  handleUpdateConfig({
                    application: { ...config?.application, start_with_windows: enabled } as any,
                  })
                }
              />

              {/* Bottom Quick Settings Panel */}
              <QuickSettings
                config={config}
                cameras={cameras}
                onSelectCamera={handleSelectCamera}
                onUpdateConfig={handleUpdateConfig}
              />
            </div>
          )}

          {activePage === 'gestures' && (
            <GesturesPage config={config} onUpdateConfig={handleUpdateConfig} />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              config={config}
              cameras={cameras}
              onSelectCamera={handleSelectCamera}
              onUpdateConfig={handleUpdateConfig}
              onOpenCalibration={() => setIsCalibrationOpen(true)}
            />
          )}
        </main>
      </div>

      <CalibrationDialog
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        hand={handData}
        onSaveCalibration={handleSaveCalibration}
      />
    </div>
  );
};

export default App;
