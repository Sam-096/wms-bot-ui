import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

declare const gsap: any;
declare const ScrollTrigger: any;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly navScrolled = signal(false);
  readonly mobileMenuOpen = signal(false);

  private scrollHandler!: () => void;
  private statsObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.scrollHandler = () => {
      this.navScrolled.set(window.scrollY > 80);
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngAfterViewInit(): void {
    this.initGsap();
    this.initCountUp();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
    this.statsObserver?.disconnect();
    try {
      if (typeof ScrollTrigger !== 'undefined') {
        ScrollTrigger.getAll().forEach((t: any) => t.kill());
      }
    } catch {}
  }

  goToDashboard(): void {
    this.router.navigate(['/login']);
  }

  private initGsap(): void {
    if (typeof gsap === 'undefined') return;
    try {
      gsap.registerPlugin(ScrollTrigger);

      gsap.from('.hero-word', {
        y: 40,
        opacity: 0,
        stagger: 0.08,
        duration: 0.7,
        ease: 'power3.out',
        delay: 0.15,
      });

      gsap.from('.hero-card', {
        x: 60,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: 'power2.out',
        delay: 0.35,
      });

      gsap.from('.feature-card', {
        y: 30,
        opacity: 0,
        stagger: 0.09,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.features-grid', start: 'top 82%' },
      });

      gsap.from('.step-item', {
        x: -30,
        opacity: 0,
        stagger: 0.18,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.steps-row', start: 'top 80%' },
      });

      gsap.from('.pricing-card', {
        y: 40,
        opacity: 0,
        stagger: 0.14,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.pricing-grid', start: 'top 80%' },
      });

      gsap.from('.testimonial-card', {
        y: 30,
        opacity: 0,
        stagger: 0.12,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: '.testimonials-grid', start: 'top 82%' },
      });
    } catch {}
  }

  private initCountUp(): void {
    const bar = document.querySelector('.stats-bar');
    if (!bar) return;

    this.statsObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        this.countTo('.stat-bags', 50000, '+', 0, 1600);
        this.countTo('.stat-uptime', 99.8, '%', 1, 1400);
        this.countTo('.stat-response', 3, ' sec', 0, 900);
        this.countTo('.stat-langs', 4, '', 0, 700);
        this.statsObserver?.disconnect();
      },
      { threshold: 0.4 },
    );
    this.statsObserver.observe(bar);
  }

  private countTo(sel: string, target: number, suffix: string, dec: number, ms: number): void {
    const el = document.querySelector(sel);
    if (!el) return;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = eased * target;
      el.textContent = (dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-IN')) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}
