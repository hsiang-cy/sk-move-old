export default function MapBackground({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.wrap}>
      <svg
        style={styles.svg}
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* ── 底色 ── */}
        <rect width="1200" height="800" fill="#f7f6f4" />

        {/* ══ 公園（道路前先畫） ══ */}
        <rect x="147" y="158" width="196" height="129" rx="10" fill="#d5e8d2" />
        <rect x="737" y="488" width="146" height="144" rx="10" fill="#d5e8d2" />

        {/* 公園樹木 */}
        <circle cx="183" cy="205" r="13" fill="#bad2b6" />
        <circle cx="220" cy="248" r="10" fill="#bad2b6" />
        <circle cx="265" cy="196" r="15" fill="#bad2b6" />
        <circle cx="312" cy="230" r="11" fill="#bad2b6" />
        <circle cx="194" cy="263" r="9"  fill="#bad2b6" />
        <circle cx="328" cy="188" r="12" fill="#bad2b6" />
        <circle cx="777" cy="530" r="12" fill="#bad2b6" />
        <circle cx="810" cy="570" r="9"  fill="#bad2b6" />
        <circle cx="848" cy="516" r="14" fill="#bad2b6" />
        <circle cx="872" cy="560" r="10" fill="#bad2b6" />

        {/* ══ 街廓 ══ */}
        {/* Row 0 */}
        <rect x="147"  y="8"   width="196" height="114" rx="8" fill="#eceae6" />
        <rect x="557"  y="8"   width="146" height="114" rx="8" fill="#eceae6" />
        <rect x="917"  y="8"   width="146" height="114" rx="8" fill="#eceae6" />
        {/* Row 1 */}
        <rect x="8"    y="158" width="105" height="129" rx="8" fill="#eceae6" />
        <rect x="377"  y="158" width="146" height="129" rx="8" fill="#eceae6" />
        <rect x="557"  y="158" width="146" height="129" rx="8" fill="#eceae6" />
        <rect x="917"  y="158" width="146" height="129" rx="8" fill="#eceae6" />
        <rect x="1097" y="158" width="95"  height="129" rx="8" fill="#eceae6" />
        {/* Row 2 */}
        <rect x="147"  y="323" width="196" height="129" rx="8" fill="#eceae6" />
        <rect x="737"  y="323" width="146" height="129" rx="8" fill="#eceae6" />
        <rect x="917"  y="323" width="146" height="129" rx="8" fill="#eceae6" />
        {/* Row 3 */}
        <rect x="147"  y="488" width="196" height="144" rx="8" fill="#eceae6" />
        <rect x="377"  y="488" width="146" height="144" rx="8" fill="#eceae6" />
        <rect x="917"  y="488" width="146" height="144" rx="8" fill="#eceae6" />
        <rect x="1097" y="488" width="95"  height="144" rx="8" fill="#eceae6" />
        {/* Row 4 */}
        <rect x="8"    y="668" width="105" height="124" rx="8" fill="#eceae6" />
        <rect x="147"  y="668" width="196" height="124" rx="8" fill="#eceae6" />
        <rect x="557"  y="668" width="146" height="124" rx="8" fill="#eceae6" />
        <rect x="737"  y="668" width="146" height="124" rx="8" fill="#eceae6" />

        {/* ══ 斜向捷徑道路 ══ */}
        <path d="M 360 470 L 540 305" stroke="#e3e2de" strokeWidth="17" strokeLinecap="round" />

        {/* ══ 主幹道（水平） ══ */}
        <rect x="0" y="130" width="1200" height="20" fill="#e3e2de" />
        <rect x="0" y="295" width="1200" height="20" fill="#e3e2de" />
        <rect x="0" y="460" width="1200" height="20" fill="#e3e2de" />
        <rect x="0" y="640" width="1200" height="20" fill="#e3e2de" />

        {/* ══ 主幹道（垂直） ══ */}
        <rect x="121"  y="0" width="18" height="800" fill="#e3e2de" />
        <rect x="351"  y="0" width="18" height="800" fill="#e3e2de" />
        <rect x="531"  y="0" width="18" height="800" fill="#e3e2de" />
        <rect x="711"  y="0" width="18" height="800" fill="#e3e2de" />
        <rect x="891"  y="0" width="18" height="800" fill="#e3e2de" />
        <rect x="1071" y="0" width="18" height="800" fill="#e3e2de" />

        {/* ══ 道路中心線（虛線） ══ */}
        <line x1="0"    y1="140" x2="1200" y2="140" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="0"    y1="305" x2="1200" y2="305" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="0"    y1="470" x2="1200" y2="470" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="0"    y1="650" x2="1200" y2="650" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="130"  y1="0" x2="130"  y2="800" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="360"  y1="0" x2="360"  y2="800" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="540"  y1="0" x2="540"  y2="800" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="720"  y1="0" x2="720"  y2="800" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="900"  y1="0" x2="900"  y2="800" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />
        <line x1="1080" y1="0" x2="1080" y2="800" stroke="#ccc9c3" strokeWidth="1.5" strokeDasharray="15 11" />

        {/* ══ 圓環（V4/H3 x=720 y=470） ══ */}
        <circle cx="720" cy="470" r="30" fill="#e3e2de" />
        <circle cx="720" cy="470" r="13" fill="#eceae6" />

        {/* ══ 定位針 ══ */}
        <g transform="translate(248, 218)" opacity="0.75">
          <path d="M0,16 C-4,10 -12,4 -12,-4 C-12,-12 -6,-18 0,-18 C6,-18 12,-12 12,-4 C12,4 4,10 0,16Z" fill="#8ab486" />
          <circle cx="0" cy="-5" r="5" fill="#eaf4e8" opacity="0.9" />
        </g>
        <g transform="translate(452, 215)" opacity="0.6">
          <path d="M0,16 C-4,10 -12,4 -12,-4 C-12,-12 -6,-18 0,-18 C6,-18 12,-12 12,-4 C12,4 4,10 0,16Z" fill="#bcb9b4" />
          <circle cx="0" cy="-5" r="5" fill="#f2f0ee" opacity="0.9" />
        </g>
        <g transform="translate(632, 58)" opacity="0.55">
          <path d="M0,16 C-4,10 -12,4 -12,-4 C-12,-12 -6,-18 0,-18 C6,-18 12,-12 12,-4 C12,4 4,10 0,16Z" fill="#bcb9b4" />
          <circle cx="0" cy="-5" r="5" fill="#f2f0ee" opacity="0.9" />
        </g>
        <g transform="translate(248, 562)" opacity="0.55">
          <path d="M0,16 C-4,10 -12,4 -12,-4 C-12,-12 -6,-18 0,-18 C6,-18 12,-12 12,-4 C12,4 4,10 0,16Z" fill="#bcb9b4" />
          <circle cx="0" cy="-5" r="5" fill="#f2f0ee" opacity="0.9" />
        </g>
        <g transform="translate(992, 222)" opacity="0.55">
          <path d="M0,16 C-4,10 -12,4 -12,-4 C-12,-12 -6,-18 0,-18 C6,-18 12,-12 12,-4 C12,4 4,10 0,16Z" fill="#bcb9b4" />
          <circle cx="0" cy="-5" r="5" fill="#f2f0ee" opacity="0.9" />
        </g>
      </svg>

      {children}
    </div>
  )
}

const styles = {
  wrap: {
    position: 'relative' as const,
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#f7f6f4',
  },
  svg: {
    position: 'absolute' as const,
    inset: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
  },
}
