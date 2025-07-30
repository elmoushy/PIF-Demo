import { computed } from 'vue'
import { useAppStore } from '../stores/useAppStore'

export function useChartTheme() {
  const appStore = useAppStore()

  const chartColors = computed(() => {
    const isLight = appStore.isLightMode

    return {
      // Text colors
      primaryText: isLight ? '#0B0F10' : '#E8EDF2',
      secondaryText: isLight ? '#4F5560' : '#B0BAC9',
      mutedText: isLight ? '#6B7280' : '#8C949E',
      
      // Background colors
      tooltipBackground: isLight ? 'rgba(248, 249, 250, 0.95)' : 'rgba(13, 23, 39, 0.95)',
      
      // Border colors
      borderColor: isLight ? 'rgba(75, 85, 99, 0.2)' : 'rgba(0, 255, 194, 0.2)',
      
      // Grid colors
      gridColor: isLight ? 'rgba(75, 85, 99, 0.1)' : 'rgba(255, 255, 255, 0.1)',
      
      // Axis colors
      axisColor: isLight ? '#6B7280' : '#9CA3AF'
    }
  })

  const getCommonChartOptions = () => {
    const colors = chartColors.value

    return {
      plugins: {
        legend: {
          labels: {
            color: colors.primaryText,
            font: {
              family: 'IBM Plex Sans Arabic',
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: colors.tooltipBackground,
          titleColor: colors.primaryText,
          bodyColor: colors.secondaryText,
          borderColor: colors.borderColor,
          borderWidth: 1,
          cornerRadius: 8
        }
      },
      scales: {
        x: {
          ticks: {
            color: colors.axisColor,
            font: {
              family: 'IBM Plex Sans Arabic',
              size: 11
            }
          },
          grid: {
            color: colors.gridColor,
            drawBorder: true,
            borderColor: colors.borderColor
          },
          title: {
            color: colors.secondaryText,
            font: {
              family: 'IBM Plex Sans Arabic',
              size: 12,
              weight: '500'
            }
          }
        },
        y: {
          ticks: {
            color: colors.axisColor,
            font: {
              family: 'IBM Plex Sans Arabic',
              size: 11
            }
          },
          grid: {
            color: colors.gridColor,
            drawBorder: true,
            borderColor: colors.borderColor
          },
          title: {
            color: colors.secondaryText,
            font: {
              family: 'IBM Plex Sans Arabic',
              size: 12,
              weight: '500'
            }
          }
        }
      }
    }
  }

  const getPieChartColors = () => {
    const colors = chartColors.value
    return {
      centerText: colors.primaryText,
      centerSubText: colors.secondaryText
    }
  }

  return {
    chartColors,
    getCommonChartOptions,
    getPieChartColors
  }
}
