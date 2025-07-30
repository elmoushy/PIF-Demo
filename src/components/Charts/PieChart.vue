<template>
  <div :class="styles.pieChartContainer">
    <Pie 
      :data="chartData" 
      :options="chartOptions" 
      :plugins="chartPlugins"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  Plugin
} from 'chart.js'
import styles from './Charts.module.css'
import { useChartTheme } from '../../hooks/useChartTheme'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

interface PieChartData {
  label: string
  value: number
  color: string
}

interface Props {
  data: PieChartData[]
  title?: string
  height?: number
  showLegend?: boolean
  showTooltip?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 300,
  showLegend: true,
  showTooltip: true
})

const { chartColors, getPieChartColors } = useChartTheme()

const chartData = computed(() => ({
  labels: props.data.map(item => item.label),
  datasets: [
    {
      data: props.data.map(item => item.value),
      backgroundColor: props.data.map(item => item.color),
      borderColor: props.data.map(item => item.color),
      borderWidth: 2,
      hoverBorderWidth: 3,
      hoverOffset: 8
    }
  ]
}))

const chartOptions = computed(() => {
  const colors = chartColors.value
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'bottom' as const,
        labels: {
          color: colors.primaryText,
          font: {
            family: 'IBM Plex Sans Arabic',
            size: 12
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        enabled: props.showTooltip,
        backgroundColor: colors.tooltipBackground,
        titleColor: colors.primaryText,
        bodyColor: colors.secondaryText,
        borderColor: colors.borderColor,
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.parsed || 0
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    },
    elements: {
      arc: {
        borderWidth: 2
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  }
})

const chartPlugins = computed((): Plugin[] => {
  const pieColors = getPieChartColors()
  
  return [
    {
      id: 'centerText',
      beforeDraw(chart: any) {
        if (props.title) {
          const { ctx, width, height } = chart
          ctx.restore()
          
          const total = props.data.reduce((sum, item) => sum + item.value, 0)
          
          ctx.font = 'bold 24px IBM Plex Sans Arabic'
          ctx.fillStyle = pieColors.centerText
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(total.toString(), width / 2, height / 2 - 10)
          
          ctx.font = '14px IBM Plex Sans Arabic'
          ctx.fillStyle = pieColors.centerSubText
          ctx.fillText('Total', width / 2, height / 2 + 15)
          
          ctx.save()
        }
      }
    }
  ]
})
</script>
