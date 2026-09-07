// Windows media-session metadata: the Now Playing card and the full-screen dossier.
(() => {
  'use strict';

  const { fx, internal, registry } = JuqBawx;
  const { settings } = internal.state;

  let track = null;

  function dossierActive() {
    const entry = registry[settings.visualizer];
    return !!(entry && entry.fullscreenUi);
  }

  function hasMetadataValue(value) {
    if (Array.isArray(value)) return value.some(item => String(item || '').trim());
    if (typeof value === 'number') return Number.isFinite(value) && value > 0;
    return value !== null && value !== undefined && String(value).trim() !== '';
  }

  function metadataText(value, fallback = 'Not supplied') {
    return hasMetadataValue(value) ? String(value).trim() : fallback;
  }

  function formatGenres(value) {
    if (Array.isArray(value)) {
      const genres = value.map(item => String(item || '').trim()).filter(Boolean);
      return genres.length ? genres.join(' · ') : 'Not supplied';
    }
    return metadataText(value);
  }

  function formatTrackPosition(current, total) {
    const trackNumber = Number(current);
    const trackCount = Number(total);
    const hasTrackNumber = Number.isFinite(trackNumber) && trackNumber > 0;
    const hasTrackCount = Number.isFinite(trackCount) && trackCount > 0;
    if (hasTrackNumber && hasTrackCount) return `Track ${trackNumber} of ${trackCount}`;
    if (hasTrackNumber) return `Track ${trackNumber}`;
    if (hasTrackCount) return `${trackCount} tracks · position not supplied`;
    return 'Not supplied';
  }

  function updateMediaDossier() {
    const d = internal.dom;
    const active = dossierActive();
    d.mediaDossierEl.classList.toggle('active', active);
    d.mediaDossierEl.classList.toggle('is-idle', !track);
    d.mediaDossierEl.setAttribute('aria-hidden', String(!active));

    if (!track) {
      d.mediaDossierEl.classList.toggle('has-long-title', false);
      d.mediaDossierEl.classList.toggle('has-very-long-title', false);
      d.dossierStateLabelEl.textContent = 'Awaiting media';
      d.dossierPlaybackBadgeEl.textContent = 'MEDIA';
      d.dossierTitleEl.textContent = 'Nothing playing';
      d.dossierArtistEl.textContent = 'Start audio or video to populate this screen';
      d.dossierAlbumEl.textContent = 'No collection available';
      d.dossierAlbumArtistEl.textContent = 'Not supplied';
      d.dossierTrackNumberEl.textContent = 'Not supplied';
      d.dossierGenresEl.textContent = 'Not supplied';
      d.dossierPlaybackTypeEl.textContent = 'Not supplied';
      d.dossierSubtitleEl.textContent = 'Not supplied';
      d.dossierArtworkStateEl.textContent = 'No artwork supplied by the player';
      d.dossierAvailabilityEl.textContent = 'Waiting for a Windows-compatible media player';
      d.dossierAlbumArtEl.style.display = 'none';
      d.dossierArtFallbackEl.style.display = 'grid';
      return;
    }

    const playbackType = metadataText(track.PlaybackType, 'Media');
    const title = metadataText(track.Title, 'Untitled media');
    const artist = metadataText(track.Artist || track.AlbumArtist, 'Unknown artist');
    const album = metadataText(track.AlbumTitle, 'No collection supplied');
    d.mediaDossierEl.classList.toggle('has-long-title', title.length > 42);
    d.mediaDossierEl.classList.toggle('has-very-long-title', title.length > 76);
    d.dossierStateLabelEl.textContent = 'Now playing';
    d.dossierPlaybackBadgeEl.textContent = playbackType.toUpperCase().slice(0, 20);
    d.dossierTitleEl.textContent = title;
    d.dossierArtistEl.textContent = artist;
    d.dossierAlbumEl.textContent = album;
    d.dossierAlbumArtistEl.textContent = metadataText(track.AlbumArtist);
    d.dossierTrackNumberEl.textContent = formatTrackPosition(track.TrackNumber, track.AlbumTrackCount);
    d.dossierGenresEl.textContent = formatGenres(track.Genres);
    d.dossierPlaybackTypeEl.textContent = metadataText(track.PlaybackType);
    d.dossierSubtitleEl.textContent = metadataText(track.Subtitle);

    if (track.Thumbnail) {
      d.dossierAlbumArtEl.src = track.Thumbnail.startsWith('data:') ? track.Thumbnail : `data:image/png;base64,${track.Thumbnail}`;
      d.dossierAlbumArtEl.alt = `Artwork for ${title}`;
      d.dossierAlbumArtEl.style.display = 'block';
      d.dossierArtFallbackEl.style.display = 'none';
      d.dossierArtworkStateEl.textContent = 'Artwork supplied by the active media session';
    } else {
      d.dossierAlbumArtEl.alt = '';
      d.dossierAlbumArtEl.style.display = 'none';
      d.dossierArtFallbackEl.style.display = 'grid';
      d.dossierArtworkStateEl.textContent = 'No artwork supplied by the player';
    }

    const fields = ['Title', 'Artist', 'AlbumArtist', 'AlbumTitle', 'TrackNumber', 'AlbumTrackCount', 'Genres', 'PlaybackType', 'Subtitle', 'Thumbnail'];
    const supplied = fields.reduce((count, key) => count + (hasMetadataValue(track[key]) ? 1 : 0), 0);
    d.dossierAvailabilityEl.textContent = `${supplied} of ${fields.length} media fields supplied by the player`;
  }

  function updateNowPlaying() {
    const d = internal.dom;
    const color = internal.color;
    const albumArtEl = d.albumArtEl;
    const visible = settings.showTrack && !!track && !dossierActive();
    d.nowPlayingEl.classList.toggle('hidden', !visible);
    if (!track) {
      updateMediaDossier();
      return;
    }
    d.titleEl.textContent = track.Title || 'Unknown title';
    d.artistEl.textContent = track.Artist || track.AlbumArtist || 'Unknown artist';
    d.albumEl.textContent = track.AlbumTitle || '';
    if (track.Thumbnail) {
      fx.albumArtReady = false;
      color.markPaletteDirty();
      color.refreshPaletteCache();
      internal.canvas.invalidateAlbumBackdrop();
      albumArtEl.onload = color.sampleAlbumColors;
      albumArtEl.src = track.Thumbnail.startsWith('data:') ? track.Thumbnail : `data:image/png;base64,${track.Thumbnail}`;
      if (albumArtEl.complete) color.sampleAlbumColors();
      albumArtEl.style.display = 'block';
      d.artFallbackEl.style.display = 'none';
    } else {
      fx.albumArtReady = false;
      color.markPaletteDirty();
      color.refreshPaletteCache();
      albumArtEl.style.display = 'none';
      d.artFallbackEl.style.display = 'grid';
    }
    color.updateDossierPalette();
    updateMediaDossier();
  }

  window.livelyCurrentTrack = function(data) {
    try { track = typeof data === 'string' ? JSON.parse(data) : data; } catch { track = null; }
    updateNowPlaying();
  };

  internal.nowplaying = { updateNowPlaying, dossierActive };
})();
