<template>
  <div :class="styles.areaChartContainer">
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

interface AreaChartDataset {
  label: string
  data: number[]
  color: string
  fillOpacity?: number
}

interface Props {
  labels: string[]
  datasets: AreaChartDataset[]
  title?: string
  height?: number
  showLegend?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
  stacked?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 300,
  showLegend: true,
  yAxisLabel: '',
  xAxisLabel: '',
  stacked: false
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
      backgroundColor: dataset.color.includes('rgba') 
        ? dataset.color.replace(/[\d.]+\)$/g, `${dataset.fillOpacity || 0.2})`)
        : dataset.color.replace('rgb', 'rgba').replace(')', `, ${dataset.fillOpacity || 0.2})`),
      borderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: dataset.color,
      pointBorderColor: colors.tooltipBackground,
      pointBorderWidth: 1,
      fill: true,
      tension: 0.4
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
    scales: {
      x: {
        stacked: props.stacked,
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
        stacked: props.stacked,
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
      },
      filler: {
        propagate: false
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  }
})
</script>
