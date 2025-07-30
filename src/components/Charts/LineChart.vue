<template>
  <div :class="styles.lineChartContainer">
    <Line 
      :data="chartData" 
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Filler
} from 'chart.js'
import styles from './Charts.module.css'
import { useChartTheme } from '../../hooks/useChartTheme'

ChartJS.register(Title, Tooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, Filler)

interface LineChartDataset {
  label: string
  data: number[]
  color: string
  fill?: boolean
}

interface Props {
  labels: string[]
  datasets: LineChartDataset[]
  title?: string
  height?: number
  showLegend?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
  smooth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 300,
  showLegend: true,
  yAxisLabel: '',
  xAxisLabel: '',
  smooth: true
})

const { chartColors } = useChartTheme()

const chartData = computed(() => {
  const colors = chartColors.value
  
  return {
    labels: props.labels,
    datasets: props.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: dataset.fill 
        ? dataset.color.replace('rgb', 'rgba').replace(')', ', 0.1)')
        : 'transparent',
      borderWidth: 3,
      pointRadius: 5,
      pointHoverRadius: 8,
      pointBackgroundColor: dataset.color,
      pointBorderColor: colors.tooltipBackground,
      pointBorderWidth: 2,
      fill: dataset.fill || false,
      tension: props.smooth ? 0.4 : 0
    }))
  }
})

const chartOptions = computed(() => {
  const colors = chartColors.value
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'top' as const,
        labels: {
          color: colors.primaryText,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: colors.tooltipBackground,
        titleColor: colors.primaryText,
        bodyColor: colors.secondaryText,
        borderColor: colors.borderColor,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: colors.gridColor,
          borderColor: colors.borderColor
        },
        ticks: {
          color: colors.axisColor,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 11
          }
        },
        title: {
          display: !!props.xAxisLabel,
          text: props.xAxisLabel,
          color: colors.secondaryText,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: colors.gridColor,
          borderColor: colors.borderColor
        },
        ticks: {
          color: colors.axisColor,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 11
          }
        },
        title: {
          display: !!props.yAxisLabel,
          text: props.yAxisLabel,
          color: colors.secondaryText,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 12
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  }
})
</script>
