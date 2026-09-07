// Document element lookups and the main drawing surface.
(() => {
  'use strict';

  const { fx, internal } = JuqBawx;

  const canvas = document.getElementById('visualizer');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  const dom = {
    canvas,
    ctx,
    body: document.body,
    nowPlayingEl: document.getElementById('nowPlaying'),
    albumArtEl: document.getElementById('albumArt'),
    artFallbackEl: document.getElementById('artFallback'),
    titleEl: document.getElementById('trackTitle'),
    artistEl: document.getElementById('trackArtist'),
    albumEl: document.getElementById('trackAlbum'),
    themeBadge: document.getElementById('themeBadge'),
    mediaDossierEl: document.getElementById('mediaDossier'),
    dossierAlbumArtEl: document.getElementById('dossierAlbumArt'),
    dossierArtFallbackEl: document.getElementById('dossierArtFallback'),
    dossierStateLabelEl: document.getElementById('dossierStateLabel'),
    dossierPlaybackBadgeEl: document.getElementById('dossierPlaybackBadge'),
    dossierTitleEl: document.getElementById('dossierTitle'),
    dossierArtistEl: document.getElementById('dossierArtist'),
    dossierAlbumEl: document.getElementById('dossierAlbum'),
    dossierAlbumArtistEl: document.getElementById('dossierAlbumArtist'),
    dossierTrackNumberEl: document.getElementById('dossierTrackNumber'),
    dossierGenresEl: document.getElementById('dossierGenres'),
    dossierPlaybackTypeEl: document.getElementById('dossierPlaybackType'),
    dossierSubtitleEl: document.getElementById('dossierSubtitle'),
    dossierArtworkStateEl: document.getElementById('dossierArtworkState'),
    dossierAvailabilityEl: document.getElementById('dossierAvailability')
  };

  internal.dom = dom;
  fx.ctx = ctx;
  fx.albumArtEl = dom.albumArtEl;
})();
