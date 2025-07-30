<template>
  <div :class="styles.barChartContainer">
    <Bar 
      :data="chartData" 
      :options="chartOptions"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import styles from './Charts.module.css'
import { useChartTheme } from '../../hooks/useChartTheme'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface Props {
  data: BarChartData[]
  title?: string
  height?: number
  horizontal?: boolean
  showLegend?: boolean
  yAxisLabel?: string
  xAxisLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 300,
  horizontal: false,
  showLegend: false,
  yAxisLabel: '',
  xAxisLabel: ''
})

const { chartColors } = useChartTheme()

const chartData = computed(() => ({
  labels: props.data.map(item => item.label),
  datasets: [
    {
      label: props.title || 'Data',
      data: props.data.map(item => item.value),
      backgroundColor: props.data.map((item, index) => 
        item.color || `hsl(${(index * 45) % 360}, 70%, 50%)`
      ),
      borderColor: props.data.map((item, index) => 
        item.color || `hsl(${(index * 45) % 360}, 70%, 40%)`
      ),
      borderWidth: 1,
      borderRadius: 4,
      borderSkipped: false,
    }
  ]
}))

const chartOptions = computed(() => {
  const colors = chartColors.value
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: props.horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'top' as const,
        labels: {
          color: colors.primaryText,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 12
          }
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
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y || context.parsed.x}`
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
      duration: 800,
      easing: 'easeInOutQuart' as const
    }
  }
})
</script>
