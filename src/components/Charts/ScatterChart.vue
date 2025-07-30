<template>
  <div :class="styles.scatterChartContainer">
    <Scatter 
      :data="chartData" 
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Scatter } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LinearScale,
  PointElement
} from 'chart.js'
import styles from './Charts.module.css'
import { useChartTheme } from '../../hooks/useChartTheme'

ChartJS.register(Title, Tooltip, Legend, LinearScale, PointElement)

interface ScatterPoint {
  x: number
  y: number
  label?: string
}

interface ScatterDataset {
  label: string
  data: ScatterPoint[]
  color: string
  pointRadius?: number
}

interface Props {
  datasets: ScatterDataset[]
  title?: string
  height?: number
  showLegend?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 300,
  showLegend: true,
  yAxisLabel: '',
  xAxisLabel: ''
})

const { chartColors } = useChartTheme()

const chartData = computed(() => {
  const colors = chartColors.value
  
  return {
    datasets: props.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.color,
      borderColor: dataset.color,
      pointRadius: dataset.pointRadius || 6,
      pointHoverRadius: 8,
      pointBorderWidth: 2,
      pointBorderColor: colors.tooltipBackground
    }))
  }
})

const chartOptions = computed(() => {
  const colors = chartColors.value
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false
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
            const point = context.parsed
            const label = context.dataset.data[context.dataIndex]?.label || context.dataset.label
            return `${label}: (${point.x}, ${point.y})`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear' as const,
        position: 'bottom' as const,
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
      duration: 800,
      easing: 'easeInOutQuart' as const
    }
  }
})
</script>
