import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import App from './App';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock expo-av
jest.mock('expo-av', () => {
    const mockSound = {
        replayAsync: jest.fn(),
        unloadAsync: jest.fn(() => Promise.resolve()),
    };
    const mockRecording = {
        stopAndUnloadAsync: jest.fn(),
        getURI: jest.fn(() => 'test-uri'),
        createNewLoadedSoundAsync: jest.fn(() => Promise.resolve({
            sound: mockSound,
            status: { durationMillis: 1000 },
        })),
    };

    return {
        Audio: {
            requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
            setAudioModeAsync: jest.fn(),
            Recording: {
                createAsync: jest.fn(() => Promise.resolve({
                    recording: mockRecording
                })),
                create: jest.fn(),
            },
            Sound: jest.fn(),
            RecordingOptionsPresets: {
                HIGH_QUALITY: {},
            }
        }
    };
});

describe('<App />', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByText } = render(<App />);
        expect(getByText('Voice Vault 🎙️')).toBeTruthy();
        expect(getByText('RECORD')).toBeTruthy();
    });

    it('records and saves a voice note', async () => {
        const { getByText } = render(<App />);

        // Start Recording
        fireEvent.press(getByText('RECORD'));

        await waitFor(() => expect(getByText('STOP')).toBeTruthy());
        expect(getByText('Recording...')).toBeTruthy();

        // Stop Recording
        fireEvent.press(getByText('STOP'));

        await waitFor(() => expect(getByText('RECORD')).toBeTruthy());
        expect(getByText('Stopped recording')).toBeTruthy();

        await waitFor(() => {
            expect(Alert.alert).toHaveBeenCalledWith("Saved", "Voice note saved! [Ad: Cloud Storage]");
        });

        expect(getByText(/Note #1/)).toBeTruthy();
    });

    it('deletes a recording', async () => {
        const { getByText, queryByText } = render(<App />);

        // Record first
        fireEvent.press(getByText('RECORD'));
        await waitFor(() => getByText('STOP'));
        fireEvent.press(getByText('STOP'));
        await waitFor(() => getByText('RECORD'));

        // Check if item exists
        expect(getByText(/Note #1/)).toBeTruthy();

        // Delete
        const deleteBtn = getByText('Delete');
        fireEvent.press(deleteBtn);

        // Verify item is gone
        await waitFor(() => {
            expect(queryByText(/Note #1/)).toBeNull();
        });
    });
});
