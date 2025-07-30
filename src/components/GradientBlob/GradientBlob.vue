<template>
  <div :class="styles.gradientBlob">
    <svg 
      :class="styles.swirlSvg" 
      viewBox="0 0 800 600" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="swirlGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="{ stopColor: '#00FFC2', stopOpacity: 0.8 }" />
          <stop offset="50%" :style="{ stopColor: '#2AB8FF', stopOpacity: 0.6 }" />
          <stop offset="100%" :style="{ stopColor: '#007E31', stopOpacity: 0.3 }" />
        </linearGradient>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
        </filter>
      </defs>
      
      <path
        :class="styles.swirlPath"
        d="M 50 300 Q 200 100 400 200 T 750 250 Q 600 400 400 350 T 50 300"
        fill="url(#swirlGradient)"
        filter="url(#blur)"
      />
      
      <path
        :class="styles.swirlPath2"
        d="M 100 400 Q 300 200 500 300 T 800 350 Q 650 500 450 450 T 100 400"
        fill="url(#swirlGradient)"
        filter="url(#blur)"
        opacity="0.6"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import styles from './GradientBlob.module.css'
</script>
