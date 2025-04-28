'use client';

import type { LotteryCategory, LotteryDraw } from '@/types/lottery';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useMemo, use } from 'react'; // Added use
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, PieChart } from 'lucide-react'; // Icons for charts
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBallColorClass } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, LabelList, Pie, PieChart as RechartsPieChart, Cell } from "recharts"

import type { ChartConfig } from "@/components/ui/chart"


interface StatisticsPageProps {
    params: Promise<{ category: string }>; // params is a Promise
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];


export default function StatisticsPage({ params }: StatisticsPageProps) {
  // Unwrap the params Promise using React.use()
  const resolvedParams = use(params);
  const category = resolvedParams.category as LotteryCategory;
  const { draws, loading } = useLotteryData(category);

  const statistics = useMemo(() => {
    if (draws.length === 0) {
      return { numberFrequencies: [], mostFrequent: [], leastFrequent: [] };
    }

    const frequencyMap: Record<number, number> = {};
    for (let i = 1; i <= 90; i++) {
      frequencyMap[i] = 0;
    }

    draws.forEach(draw => {
      draw.numbers.forEach(num => {
        if (frequencyMap[num] !== undefined) {
          frequencyMap[num]++;
        }
      });
    });

    const numberFrequencies = Object.entries(frequencyMap)
      .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }))
      .sort((a, b) => a.number - b.number); // Sort by number for table consistency

    const sortedByFrequency = [...numberFrequencies].sort((a, b) => b.frequency - a.frequency);

    const mostFrequent = sortedByFrequency.slice(0, 10); // Top 10
    const leastFrequent = sortedByFrequency.slice(-10).reverse(); // Bottom 10

    return { numberFrequencies, mostFrequent, leastFrequent };
  }, [draws]);

  // Prepare data for charts
    const barChartData = useMemo(() => {
        return statistics.numberFrequencies
            .filter(item => item.frequency > 0) // Only show numbers that appeared
            .sort((a, b) => b.frequency - a.frequency) // Sort by frequency desc for bar chart
            .slice(0, 20) // Take top 20 for readability
            .map(item => ({
                number: item.number.toString(),
                Fréquence: item.frequency,
                fill: getBallColorClass(item.number).replace('bg-', 'var(--color-') // Map color
            }));
    }, [statistics.numberFrequencies]);


    const pieChartDataMost = useMemo(() => {
        return statistics.mostFrequent.map((item, index) => ({
            number: item.number.toString(),
            frequency: item.frequency,
             fill: COLORS[index % COLORS.length], // Cycle through defined colors
        }));
    }, [statistics.mostFrequent]);

    const pieChartDataLeast = useMemo(() => {
        return statistics.leastFrequent.map((item, index) => ({
            number: item.number.toString(),
            frequency: item.frequency,
            fill: COLORS[index % COLORS.length],
        }));
    }, [statistics.leastFrequent]);


    const barChartConfig = useMemo(() => {
        const config: ChartConfig = {};
        barChartData.forEach(item => {
            // Simple mapping assuming getBallColorClass gives a direct CSS class
            // This needs refinement based on actual color variable mapping
             config[item.number] = {
                label: item.number,
                // Attempt to map ball color - might need a lookup table
                color: `hsl(var(--chart-${parseInt(item.number) % 5 + 1}))`
             };
        });
        config["Fréquence"] = { label: "Fréquence" }; // Add label for the data key
        return config;
    }, [barChartData]);


    const pieChartConfig = useMemo(() => {
        const config: ChartConfig = {};
        [...pieChartDataMost, ...pieChartDataLeast].forEach(item => {
             config[item.number] = { label: item.number, color: item.fill };
        });
         config["frequency"] = { label: "Fréquence" };
        return config;
    }, [pieChartDataMost, pieChartDataLeast]);


  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
        </div>
         <Card><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

   if (draws.length === 0) {
     return (
       <Alert>
         <Info className="h-4 w-4" />
         <AlertTitle>Données Insuffisantes</AlertTitle>
         <AlertDescription>
           Aucune donnée de tirage n'est disponible pour la catégorie {category}. Veuillez d'abord enregistrer des tirages dans l'onglet 'Entrées'.
         </AlertDescription>
       </Alert>
     );
   }


  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-foreground">Statistiques des Numéros</h2>

       {/* Charts Section */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-medium">Fréquence des Numéros (Top 20)</CardTitle>
                <BarChart className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                        <RechartsBarChart accessibilityLayer data={barChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <CartesianGrid horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="number"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={10}
                            width={30} // Ensure enough space for numbers
                            tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}

                          />
                         <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" hideLabel />}
                         />
                          <Bar dataKey="Fréquence" radius={4}>
                            <LabelList
                                position="right"
                                offset={8}
                                className="fill-foreground"
                                fontSize={12}
                                />
                              {barChartData.map((entry) => (
                                <Cell key={`cell-${entry.number}`} fill={entry.fill.replace('var(--color-', 'hsl(var(--chart-').replace('))', '))')} />
                              ))}
                          </Bar>
                        </RechartsBarChart>
                    </ChartContainer>
                </CardContent>
            </Card>


           <div className="space-y-6">
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Top 10 Numéros les Plus Fréquents</CardTitle>
                     <PieChart className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="flex items-center justify-center">
                        <ChartContainer config={pieChartConfig} className="h-[130px] w-[130px]">
                             <RechartsPieChart>
                                 <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="number" />} />
                                <Pie data={pieChartDataMost} dataKey="frequency" nameKey="number" innerRadius={30} outerRadius={50} strokeWidth={1}>
                                     {pieChartDataMost.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-background hover:opacity-80" />
                                    ))}
                                </Pie>
                             </RechartsPieChart>
                        </ChartContainer>
                     </CardContent>
                 </Card>
                <Card className="shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">Top 10 Numéros les Moins Fréquents</CardTitle>
                    <PieChart className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                     <CardContent className="flex items-center justify-center">
                        <ChartContainer config={pieChartConfig} className="h-[130px] w-[130px]">
                             <RechartsPieChart>
                               <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="number" />} />
                                <Pie data={pieChartDataLeast} dataKey="frequency" nameKey="number" innerRadius={30} outerRadius={50} strokeWidth={1}>
                                    {pieChartDataLeast.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} className="stroke-background hover:opacity-80" />
                                    ))}
                                </Pie>
                             </RechartsPieChart>
                        </ChartContainer>
                     </CardContent>
                 </Card>
            </div>
        </div>


      {/* Table View */}
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Fréquence de Tous les Numéros</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Numéro</TableHead>
                  <TableHead>Fréquence</TableHead>
                   <TableHead className="text-right">Pourcentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {statistics.numberFrequencies.map(({ number, frequency }) => (
                  <TableRow key={number}>
                    <TableCell>
                      <span className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold text-white shadow ${getBallColorClass(number)}`}>
                        {number}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{frequency}</TableCell>
                     <TableCell className="text-right">{((frequency / draws.length) * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* PDF Export Button Placeholder */}
      {/* <Button disabled>
        <Download className="mr-2 h-4 w-4" />
        Exporter en PDF (Bientôt disponible)
      </Button> */}
    </div>
  );
}
