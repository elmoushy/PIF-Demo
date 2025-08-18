<template>
  <div v-if="isVisible" :class="$style.modalOverlay" @click="handleOverlayClick">
    <div :class="$style.modalContainer" @click.stop>
      <div :class="$style.modalHeader">
        <div :class="$style.warningIcon">⚠️</div>
        <h2 :class="$style.modalTitle">{{ title }}</h2>
      </div>

      <div :class="$style.modalBody">
        <p :class="$style.modalMessage">{{ message }}</p>
      </div>

      <div :class="$style.modalActions">
        <button
          type="button"
          :class="[$style.button, $style.cancelButton]"
          @click="$emit('cancel')"
        >
          {{ cancelText }}
        </button>
        <button
          type="button"
          :class="[$style.button, $style.confirmButton]"
          @click="$emit('confirm')"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isVisible: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleOverlayClick = (event: Event) => {
  if (event.target === event.currentTarget) {
    emit('cancel')
  }
}
</script>

<style module>
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.modalContainer {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  backdrop-filter: blur(20px);
  width: 100%;
  max-width: 400px;
  animation: modalSlideIn 0.3s ease-out;
}

[data-theme="light"] .modalContainer {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 99, 75, 0.1);
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modalHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem 2rem 1rem 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

[data-theme="light"] .modalHeader {
  border-bottom-color: rgba(0, 99, 75, 0.1);
}

.warningIcon {
  font-size: 2rem;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.05);
  }
}

.modalTitle {
  font-size: 1.3rem;
  font-weight: 700;
  color: #E8EDF2;
  margin: 0;
}

[data-theme="light"] .modalTitle {
  color: #112821;
}

.modalBody {
  padding: 1rem 2rem;
}

.modalMessage {
  font-size: 1rem;
  color: #8C949E;
  line-height: 1.5;
  margin: 0;
}

[data-theme="light"] .modalMessage {
  color: #48635A;
}

.modalActions {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem 2rem 2rem;
  justify-content: flex-end;
}

.button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.cancelButton {
  background: rgba(255, 255, 255, 0.1);
  color: #8C949E;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

[data-theme="light"] .cancelButton {
  background: rgba(0, 0, 0, 0.05);
  color: #48635A;
  border-color: rgba(0, 99, 75, 0.2);
}

.cancelButton:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #E8EDF2;
  transform: translateY(-2px);
}

[data-theme="light"] .cancelButton:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #112821;
}

.confirmButton {
  background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  color: #FFFFFF;
}

.confirmButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 32px rgba(239, 68, 68, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .modalOverlay {
    padding: 1rem;
  }
  
  .modalActions {
    flex-direction: column-reverse;
  }
  
  .button {
    width: 100%;
  }
}
</style>
