import './globals.css';
import './legacy-reference.css';
import DashboardV2 from './DashboardV2';
export const metadata={title:'오스템 VAN 설문 V2',description:'카드결제서비스(VAN) 설문 및 비교제안'};
export default function RootLayout({children}){return <html lang="ko"><body>{children}<DashboardV2/></body></html>}
