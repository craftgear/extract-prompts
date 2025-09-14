declare module 'mp4box' {
  export interface MP4Info {
    duration: number;
    timescale: number;
    isFragmented: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4Track[];
    mime: string;
    audioTracks: MP4AudioTrack[];
    videoTracks: MP4VideoTrack[];
    udta?: MP4Box[];
  }

  export interface MP4Track {
    id: number;
    created: Date;
    modified: Date;
    movie_duration: number;
    layer: number;
    alternate_group: number;
    volume: number;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    bitrate: number;
    codec: string;
    language: string;
    nb_samples: number;
    size: number;
    type: string;
  }

  export interface MP4AudioTrack extends MP4Track {
    audio: {
      sample_rate: number;
      channel_count: number;
      sample_size: number;
    };
  }

  export interface MP4VideoTrack extends MP4Track {
    video: {
      width: number;
      height: number;
    };
  }

  export interface MP4Box {
    type: string;
    size: number;
    data?: Uint8Array;
  }

  export interface MP4MediaSource {
    // File access methods
    getBuffer: () => ArrayBuffer;
    setFileStart: (start: number) => void;

    // Event handlers
    onReady?: (info: MP4Info) => void;
    onError?: (error: string) => void;
    onSegment?: (id: number, user: any, buffer: ArrayBuffer) => void;
  }

  export function createFile(): MP4MediaSource;
  export const DataStream: any;
  export const Log: any;
}