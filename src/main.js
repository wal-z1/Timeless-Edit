import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { loadLyrics, formatLine } from './lyrics.js';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = window.matchMedia('(pointer: coarse)').matches;
const lyricsElement = document.querySelector('.lyrics');
const sectionStatus = document.querySelector('.current-section');
const countStatus = document.querySelector('.statusbar__count');
const progress = document.querySelector('.progress span');
const autoScrollButton = document.querySelector('.autoscroll');
const youtubeToggle = document.querySelector('.youtube-player__toggle');
const youtubePlayer = document.querySelector('.youtube-player');
const youtubeFrame = document.querySelector('#youtube-iframe');
const autoScrollPrompt = document.querySelector('.autoscroll-prompt');
let autoScrollTimer;
let autoScrolling = false;
let youtubeController;

function lineMarkup(text) {
  return formatLine(text).map(({ text: value, adlib }) =>
    adlib ? `<span class="adlib">${value}</span>` :
      value.split(/(\s+)/).map((part) => /^\s+$/.test(part) ? part : `<span class="word">${part}</span>`).join('')
  ).join('');
}

function render(data) {
  let lineNumber = 0;
  lyricsElement.innerHTML = data.sections.map((section) => {
    const kind = section.label.toLowerCase().includes('chorus') ? ' section--chorus' :
      section.label.toLowerCase().includes('outro') ? ' section--outro' : '';
    const lines = section.lines.map((line) => {
      lineNumber += 1;
      return `<p class="lyric-line" data-line="${lineNumber}" data-section="${section.label}"><span class="line__inner">${lineMarkup(line.text)}</span><span class="line-sweep" aria-hidden="true"></span></p>`;
    }).join('');
    return `<section class="lyric-section${kind}" data-section-label="${section.label}">
      <header class="section-heading"><span>${section.label}</span><i>${section.performers || 'The Weeknd'}</i></header>
      <div class="section-lines">${lines}</div>
    </section>`;
  }).join('');
  countStatus.textContent = `00 / ${String(lineNumber).padStart(2, '0')}`;
  return lineNumber;
}

function initExperience(totalLines) {
  const lines = gsap.utils.toArray('.lyric-line');
  const sections = gsap.utils.toArray('.lyric-section');
  const lenis = coarse || prefersReduced ? null : new Lenis({ autoRaf: false, smoothWheel: true });
  if (lenis) {
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const particleCount = coarse ? 30 : 72;
  const particleLayer = document.createElement('div');
  particleLayer.className = 'particles';
  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement('i');
    particle.style.setProperty('--x', `${Math.random() * 100}%`);
    particle.style.setProperty('--delay', `${Math.random() * -12}s`);
    particle.style.setProperty('--duration', `${8 + Math.random() * 10}s`);
    particle.style.setProperty('--size', `${1 + Math.random() * 2.5}px`);
    particleLayer.appendChild(particle);
  }
  document.querySelector('.site-shell').prepend(particleLayer);
  if (!prefersReduced) {
    gsap.to(particleLayer, {
      yPercent: -18,
      xPercent: 2,
      ease: 'none',
      scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 1.4 }
    });
  }

  gsap.from('.hero__title span', {
    yPercent: 120, opacity: 0, duration: 1.2, stagger: 0.06, ease: 'power3.out',
    delay: prefersReduced ? 0 : 0.15
  });
  gsap.from(['.eyebrow', '.hero__artist', '.scroll-hint'], {
    y: 18, opacity: 0, duration: 0.8, stagger: 0.1, delay: 0.7, ease: 'power2.out'
  });

  if (!prefersReduced) {
    gsap.to('.ambient--one', { xPercent: 12, yPercent: 8, scrollTrigger: { scrub: 1.5, start: 0, end: 'max' } });
    gsap.to('.ambient--two', { xPercent: -14, yPercent: -10, scrollTrigger: { scrub: 2, start: 0, end: 'max' } });
    gsap.to('.clock', { rotation: 360, scrollTrigger: { scrub: 1, start: 0, end: 'max' } });
  }
  sections.forEach((section) => {
    ScrollTrigger.create({
      trigger: section, start: 'top 55%', end: 'bottom 45%',
      onEnter: () => { sectionStatus.textContent = section.dataset.sectionLabel; },
      onEnterBack: () => { sectionStatus.textContent = section.dataset.sectionLabel; }
    });
  });
  lines.forEach((line, index) => {
    ScrollTrigger.create({
      trigger: line, start: 'center 66%', end: 'center 34%',
      onEnter: () => activate(line, index),
      onEnterBack: () => activate(line, index),
      onLeave: () => line.classList.remove('is-active'),
      onLeaveBack: () => line.classList.remove('is-active')
    });
  });
  ScrollTrigger.create({
    trigger: document.body, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { progress.style.transform = `scaleX(${self.progress})`; }
  });
  function activate(line, index) {
    lines.forEach((item, itemIndex) => {
      item.classList.toggle('is-active', item === line);
      item.classList.toggle('is-near', Math.abs(itemIndex - index) <= 2);
    });
    const words = line.querySelectorAll('.word');
    gsap.killTweensOf([line, words]);
    if (!prefersReduced) {
      gsap.fromTo(line, { y: 24, opacity: .3 }, { y: 0, opacity: 1, duration: .72, ease: 'power3.out', overwrite: true });
      gsap.fromTo(words, { yPercent: 110, opacity: 0 }, {
        yPercent: 0, opacity: 1, duration: .72, stagger: .035, ease: 'power4.out', overwrite: true
      });
      gsap.fromTo(line.querySelector('.line-sweep'), { scaleX: 0, opacity: .85 }, {
        scaleX: 1, opacity: 0, duration: .8, ease: 'power2.out', overwrite: true
      });
    }
    const section = line.closest('.lyric-section');
    const isPeak = section?.classList.contains('section--chorus') || section?.classList.contains('section--outro');
    if (isPeak && !prefersReduced) {
      document.body.classList.remove('is-beat');
      void document.body.offsetWidth;
      document.body.classList.add('is-beat');
    }
    countStatus.textContent = `${String(index + 1).padStart(2, '0')} / ${String(totalLines).padStart(2, '0')}`;
  }
  function stopAutoScroll() {
    autoScrolling = false;
    window.clearInterval(autoScrollTimer);
    autoScrollButton.setAttribute('aria-pressed', 'false');
    autoScrollButton.classList.remove('is-playing');
    autoScrollButton.querySelector('.autoscroll__icon').textContent = '▶';
  }
  function startAutoScroll() {
    if (autoScrolling) return;
    autoScrolling = true;
    autoScrollButton.setAttribute('aria-pressed', 'true');
    autoScrollButton.classList.add('is-playing');
    autoScrollButton.querySelector('.autoscroll__icon').textContent = 'Ⅱ';
    autoScrollTimer = window.setInterval(() => {
      const step = Math.max(1, window.innerHeight * 0.22);
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
        stopAutoScroll();
        return;
      }
      if (lenis) lenis.scrollTo(window.scrollY + step, { duration: 1.1 });
      else window.scrollBy({ top: step, behavior: 'smooth' });
    }, prefersReduced ? 2600 : 1800);
  }
  autoScrollButton.addEventListener('click', () => {
    if (autoScrolling) stopAutoScroll();
    else startAutoScroll();
  });
  function rememberAutoScrollChoice(choice) {
    try {
      localStorage.setItem('timeless-auto-scroll', choice);
    } catch (error) {
      console.warn('Auto-scroll preference could not be saved.', error);
    }
  }
  function showAutoScrollPrompt() {
    let choice;
    try {
      choice = localStorage.getItem('timeless-auto-scroll');
    } catch (error) {
      console.warn('Auto-scroll preference could not be read.', error);
    }
    if (choice) {
      if (choice === 'yes') startAutoScroll();
      return;
    }
    autoScrollPrompt.hidden = false;
    autoScrollPrompt.querySelector('[data-autoscroll-choice="yes"]').focus();
  }
  autoScrollPrompt.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-autoscroll-choice]')?.dataset.autoscrollChoice;
    if (!choice) return;
    rememberAutoScrollChoice(choice);
    autoScrollPrompt.hidden = true;
    if (choice === 'yes') startAutoScroll();
  });
  window.addEventListener('wheel', stopAutoScroll, { passive: true });
  window.addEventListener('touchstart', stopAutoScroll, { passive: true });
  youtubeToggle.addEventListener('click', () => {
    const expanded = youtubePlayer.classList.toggle('is-open');
    youtubeToggle.setAttribute('aria-expanded', String(expanded));
    youtubeToggle.firstChild.textContent = expanded ? 'Close player ' : 'Open player ';
  });
  document.querySelector('.site-shell').addEventListener('click', (event) => {
    if (!youtubePlayer.classList.contains('is-open')) return;
    if (youtubePlayer.contains(event.target)) return;
    youtubePlayer.classList.remove('is-open');
    youtubeToggle.setAttribute('aria-expanded', 'false');
    youtubeToggle.firstChild.textContent = 'Open player ';
  });
  function loadYouTubeApi() {
    if (window.YT?.Player) {
      createYouTubePlayer();
      return;
    }
    window.onYouTubeIframeAPIReady = createYouTubePlayer;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  }
  function createYouTubePlayer() {
    youtubeController = new window.YT.Player(youtubeFrame, {
      events: {
        onStateChange: ({ data }) => {
          if (data === window.YT.PlayerState.PLAYING) {
            youtubePlayer.classList.add('is-playing');
            if (autoScrolling) return;
            syncLyricsToPlayback();
          } else {
            youtubePlayer.classList.remove('is-playing');
          }
        }
      }
    });
  }
  function syncLyricsToPlayback() {
    if (!youtubeController?.getDuration) return;
    const duration = youtubeController.getDuration();
    if (!duration) return;
    const ratio = Math.min(1, youtubeController.getCurrentTime() / duration);
    const index = Math.min(lines.length - 1, Math.floor(ratio * lines.length));
    activate(lines[index], index);
    if (autoScrolling) {
      lines[index].scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
    }
  }
  window.setInterval(() => {
    if (youtubeController?.getPlayerState?.() === window.YT?.PlayerState.PLAYING) syncLyricsToPlayback();
  }, 500);
  loadYouTubeApi();
  showAutoScrollPrompt();
  document.querySelector('.replay').addEventListener('click', (event) => {
    event.preventDefault();
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
  if (!coarse) {
    const glow = document.querySelector('.cursor-glow');
    window.addEventListener('pointermove', (event) => {
      glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    }, { passive: true });
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) gsap.ticker.sleep();
    else gsap.ticker.wake();
  });
}

loadLyrics().then((data) => initExperience(render(data))).catch((error) => {
  lyricsElement.innerHTML = '<p class="load-error">Unable to load the lyric experience.</p>';
  console.error(error);
});
