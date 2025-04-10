"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

interface AnimatedGradientBackgroundProps {
  className?: string
  children?: React.ReactNode
  intensity?: "subtle" | "medium" | "strong"
  inactivityTimeout?: number // 사용자 비활성 제한 시간(ms)
}

interface Beam {
  x: number
  y: number
  width: number
  length: number
  angle: number
  speed: number
  opacity: number
  hue: number
  pulse: number
  pulseSpeed: number
}

function createBeam(width: number, height: number): Beam {
  const angle = -35 + Math.random() * 10
  return {
    x: Math.random() * width * 1.5 - width * 0.25,
    y: Math.random() * height * 1.5 - height * 0.25,
    width: 30 + Math.random() * 60,
    length: height * 2.5,
    angle: angle,
    speed: 0.6 + Math.random() * 1.2,
    opacity: 0.12 + Math.random() * 0.16,
    hue: 190 + Math.random() * 70,
    pulse: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  }
}

// 이벤트 스로틀링 유틸리티 함수
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastFunc: number
  let lastRan: number
  return function(this: any, ...args: Parameters<T>) {
    if (!lastRan) {
      func.apply(this, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = window.setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func.apply(this, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

export default function BeamsBackground({ 
  className, 
  intensity = "strong", 
  inactivityTimeout = 60000 // 기본값: 1분
}: AnimatedGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const beamsRef = useRef<Beam[]>([])
  const animationFrameRef = useRef<number>(0)
  const animationActiveRef = useRef<boolean>(true)
  const lastActivityRef = useRef<number>(Date.now())
  // 모바일/저사양 기기 감지
  const isLowPowerDevice = useRef<boolean>(false)
  const minBeamsRef = useRef<number>(25) // 빔 개수 기본값 20 → 10으로 감소
  
  // 비활성 상태 관리
  const [isInactive, setIsInactive] = useState(false)

  const opacityMap = {
    subtle: 0.6,
    medium: 0.75,
    strong: 0.9, // 전체적으로 약간 투명도 증가
  }

  // animate 함수 참조 저장
  const animateRef = useRef<((timestamp: number) => void) | null>(null)
  // 마지막 프레임 시간 추적
  const lastFrameTimeRef = useRef<number>(0)
  // 목표 FPS (저사양 기기에서는 30, 일반 기기에서는 60)
  const targetFPSRef = useRef<number>(60)

  // 애니메이션 시작/중지 함수
  const startAnimation = () => {
    if (!animationActiveRef.current && canvasRef.current && animateRef.current) {
      animationActiveRef.current = true;
      animateRef.current(performance.now());
    }
  };

  const stopAnimation = () => {
    animationActiveRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = 0;
    }
  };

  // 사용자 활동 감지 (스로틀링 적용)
  const trackUserActivity = useCallback(throttle(() => {
    lastActivityRef.current = Date.now();
    if (isInactive) {
      setIsInactive(false);
      startAnimation();
    }
  }, 150), [isInactive]); // 100ms 스로틀링

  // 저사양 기기 감지
  useEffect(() => {
    // 모바일 기기 감지
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      typeof navigator !== 'undefined' ? navigator.userAgent : ''
    );
    
    // 저사양 기기로 판단하는 조건 (모바일이거나 저사양 브라우저 환경)
    isLowPowerDevice.current = isMobile || (window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    
    // 저사양 기기 최적화
    if (isLowPowerDevice.current) {
      minBeamsRef.current = 5; // 저사양 기기에서는 빔 수 크게 감소
      targetFPSRef.current = 30; // 저사양 기기에서는 30 FPS로 제한
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { 
      alpha: true,
      desynchronized: true // 가능한 경우 메인 스레드와 비동기적으로 실행하여 성능 향상
    })
    if (!ctx) return

    // 사용자 활동 이벤트 리스너 (스로틀링 적용됨)
    window.addEventListener('mousemove', trackUserActivity);
    window.addEventListener('click', trackUserActivity);
    window.addEventListener('scroll', trackUserActivity);
    window.addEventListener('keydown', trackUserActivity);
    window.addEventListener('touchstart', trackUserActivity);

    const updateCanvasSize = () => {
      // 모든 기기에서 DPR=1로 고정하여 성능 향상
      const dpr = isLowPowerDevice.current ? 0.75 : 1;
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)

      const totalBeams = minBeamsRef.current * (isLowPowerDevice.current ? 1 : 1.2)
      // 이미 생성된 빔이 있으면 재사용
      if (beamsRef.current.length === 0) {
        beamsRef.current = Array.from({ length: totalBeams }, () => createBeam(canvas.width, canvas.height))
      } else {
        // 사이즈에 맞게 빔 조정
        beamsRef.current.forEach(beam => {
          beam.length = canvas.height * 2.5;
        });
        
        // 필요시 빔 개수 조정
        if (beamsRef.current.length < totalBeams) {
          const additionalBeams = Array.from(
            { length: totalBeams - beamsRef.current.length }, 
            () => createBeam(canvas.width, canvas.height)
          );
          beamsRef.current = [...beamsRef.current, ...additionalBeams];
        } else if (beamsRef.current.length > totalBeams) {
          beamsRef.current = beamsRef.current.slice(0, totalBeams);
        }
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", throttle(updateCanvasSize, 250))

    function resetBeam(beam: Beam, index: number, totalBeams: number) {
      if (!canvas) return beam

      const column = index % 3
      const spacing = canvas.width / 3

      beam.y = canvas.height + 100
      beam.x = column * spacing + spacing / 2 + (Math.random() - 0.5) * spacing * 0.5
      beam.width = 100 + Math.random() * 100
      beam.speed = 0.5 + Math.random() * 0.4
      beam.hue = 190 + (index * 70) / totalBeams
      beam.opacity = 0.2 + Math.random() * 0.1
      return beam
    }

    function drawBeam(ctx: CanvasRenderingContext2D, beam: Beam) {
      ctx.save()
      ctx.translate(beam.x, beam.y)
      ctx.rotate((beam.angle * Math.PI) / 180)

      // Calculate pulsing opacity
      const pulsingOpacity = beam.opacity * (0.8 + Math.sin(beam.pulse) * 0.2) * opacityMap[intensity]

      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length)

      // Enhanced gradient with multiple color stops - 색상 단계 줄임
      gradient.addColorStop(0, `hsla(${beam.hue}, 85%, 65%, 0)`)
      gradient.addColorStop(0.2, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`)
      gradient.addColorStop(0.5, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity})`)
      gradient.addColorStop(0.8, `hsla(${beam.hue}, 85%, 65%, ${pulsingOpacity * 0.5})`)
      gradient.addColorStop(1, `hsla(${beam.hue}, 85%, 65%, 0)`)

      ctx.fillStyle = gradient
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length)
      ctx.restore()
    }

    function checkInactivity() {
      const now = Date.now();
      if (now - lastActivityRef.current > inactivityTimeout) {
        if (!isInactive) {
          setIsInactive(true);
          stopAnimation();
        }
      } else if (isInactive) {
        setIsInactive(false);
        startAnimation();
      }
    }

    function animate(timestamp: number) {
      // 프레임 속도 제한 (기본 60fps 또는 저사양 30fps)
      const frameInterval = 1000 / targetFPSRef.current;
      const elapsed = timestamp - lastFrameTimeRef.current;
      
      if (elapsed < frameInterval) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastFrameTimeRef.current = timestamp - (elapsed % frameInterval);
      
      // 애니메이션 활성화 상태가 아니면 중지
      if (!animationActiveRef.current) return;
      
      if (!canvas || !ctx) return

      // 사용자 비활성 확인
      checkInactivity();

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Canvas 컨텍스트 블러를 감소시키고, CSS 블러만 사용
      // ctx.filter = isLowPowerDevice.current ? "blur(10px)" : "blur(15px)" 

      const totalBeams = beamsRef.current.length
      beamsRef.current.forEach((beam, index) => {
        beam.y -= beam.speed
        beam.pulse += beam.pulseSpeed

        // Reset beam when it goes off screen
        if (beam.y + beam.length < -100) {
          resetBeam(beam, index, totalBeams)
        }

        drawBeam(ctx, beam)
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // animate 함수 참조 저장
    animateRef.current = animate;

    // 페이지 가시성 변경 이벤트 핸들러
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        trackUserActivity(); // 탭이 다시 활성화되면 사용자 활동으로 간주
      }
    };
    
    // 페이지 가시성 이벤트 리스너 등록
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 초기 애니메이션 시작
    animationActiveRef.current = true;
    lastFrameTimeRef.current = performance.now();
    animate(performance.now());

    // 메모리 누수 방지를 위한 클린업
    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', trackUserActivity);
      window.removeEventListener('click', trackUserActivity);
      window.removeEventListener('scroll', trackUserActivity);
      window.removeEventListener('keydown', trackUserActivity);
      window.removeEventListener('touchstart', trackUserActivity);
      
      stopAnimation();
      
      // 큰 배열 참조 정리
      beamsRef.current = [];
    }
  }, [intensity, inactivityTimeout, isInactive, trackUserActivity])

  // 화면에 다시 포커스될 때 애니메이션 재개
  useEffect(() => {
    if (!isInactive) {
      startAnimation();
    }
  }, [isInactive]);

  return (
    <div className={cn("relative min-h-screen w-full overflow-hidden bg-neutral-950", className)}>
      <canvas ref={canvasRef} className="absolute inset-0" style={{ filter: "blur(15px)" }} />

      <motion.div
        className="absolute inset-0 bg-neutral-950/20"
        animate={{
          opacity: [0.2, 0.3, 0.2],
        }}
        transition={{
          duration: 10,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
        style={{
          backdropFilter: "blur(10px)",
        }}
      />

      <div className="relative z-10 flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-6 px-4 text-center">
          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tighter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Dong-Ha Shin
          </motion.h1>
          <motion.p
            className="text-lg md:text-2xl lg:text-3xl text-white/70 tracking-tighter"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Holography Researcher & Machine Learning Engineer
          </motion.p>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </div>
  )
}
