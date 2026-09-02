import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { usePortfolioTargets } from '@/hooks/usePortfolioTargets';
import { useSinkingFunds } from '@/hooks/useSinkingFunds';
import { useMonthlyBills } from '@/hooks/useMonthlyBills';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { Wallet, Target, PiggyBank, Calendar } from 'lucide-react';

export function FinancePage() {
  const [activeTab, setActiveTab] = useState('accounts');
  const { data: accounts, isLoading: accountsLoading } = useAccounts();
  const { data: portfolioTargets, isLoading: targetsLoading } = usePortfolioTargets();
  const { data: sinkingFunds, isLoading: fundsLoading } = useSinkingFunds();
  const { data: monthlyBills, isLoading: billsLoading } = useMonthlyBills();

  if (accountsLoading || targetsLoading || fundsLoading || billsLoading) {
    return <SkeletonLoader />;
  }

  const totalLiquidBalance =
    accounts?.filter((a) => a.is_liquid).reduce((sum, a) => sum + a.current_balance, 0) ?? 0;

  const totalEmergencyBalance =
    accounts?.filter((a) => !a.is_liquid).reduce((sum, a) => sum + a.current_balance, 0) ?? 0;

  const totalBillsAmount = monthlyBills?.reduce((sum, b) => sum + b.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Finance</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquid Accounts</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <CurrencyDisplay amount={totalLiquidBalance} />
            </p>
            <p className="text-xs text-gray-500">Available for bills & spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emergency Fund</CardTitle>
            <PiggyBank className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <CurrencyDisplay amount={totalEmergencyBalance} />
            </p>
            <p className="text-xs text-gray-500">Protected / not liquid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Bills</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              <CurrencyDisplay amount={totalBillsAmount} />
            </p>
            <p className="text-xs text-gray-500">Total recurring bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinking Funds</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {sinkingFunds?.length || 0}
            </p>
            <p className="text-xs text-gray-500">Active savings goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="sinking">Sinking Funds</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          {accounts && accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <div>
                        <p className="text-lg">{account.account_name}</p>
                        <p className="text-sm text-gray-500">{account.institution}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${account.is_liquid ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                        {account.is_liquid ? 'Liquid' : 'Emergency'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      <CurrencyDisplay amount={account.current_balance} />
                    </p>
                    <p className="text-sm text-gray-500 mt-2">{account.account_type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No accounts" description="Add accounts to track your finances" />
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          {portfolioTargets && portfolioTargets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolioTargets.map((target) => (
                <Card key={target.id}>
                  <CardHeader>
                    <CardTitle>{target.asset_class}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-3xl font-bold text-blue-600">{target.target_percentage}%</p>
                        <p className="text-sm text-gray-500">Target allocation</p>
                      </div>
                      {target.parent_bucket && (
                        <p className="text-sm text-gray-500">Bucket: {target.parent_bucket}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No portfolio targets" description="Set asset allocation targets" />
          )}
        </TabsContent>

        <TabsContent value="sinking" className="space-y-4">
          {sinkingFunds && sinkingFunds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sinkingFunds.map((fund) => {
                const progress = (fund.current_amount / fund.target_amount) * 100;
                return (
                  <Card key={fund.id}>
                    <CardHeader>
                      <CardTitle className="flex justify-between">
                        <span>{fund.goal_name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${fund.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {fund.status}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          <CurrencyDisplay amount={fund.current_amount} /> / <CurrencyDisplay amount={fund.target_amount} />
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                      <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No sinking funds" description="Create savings goals" />
          )}
        </TabsContent>

        <TabsContent value="bills" className="space-y-4">
          {monthlyBills && monthlyBills.length > 0 ? (
            <div className="space-y-2">
              {monthlyBills.map((bill) => (
                <Card key={bill.id}>
                  <CardContent className="flex justify-between items-center p-4">
                    <div>
                      <p className="font-medium">{bill.bill_name}</p>
                      <p className="text-sm text-gray-500">Due: Day {bill.due_day}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        <CurrencyDisplay amount={bill.amount || 0} />
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${bill.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {bill.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No bills" description="Add monthly bills to track" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
