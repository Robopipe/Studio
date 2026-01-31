import { type SVGProps } from "react";

interface AuthBackgroundProps extends SVGProps<SVGSVGElement> {}

export const AuthBackground = (props: AuthBackgroundProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="864"
      height="764"
      fill="none"
      viewBox="0 0 864 764"
      {...props}
    >
      <path fill="#20A963" d="M101 88h86v20h-86z" />
      <path
        fill="url(#a)"
        stroke="url(#b)"
        d="M101.5 108.5h322v251h-322z"
        fillOpacity=".1"
      />
      <foreignObject width="745" height="774" x="199" y="22">
        <div
          style={{
            backdropFilter: "blur(16px)",
            clipPath: "url(#c)",
            height: "100%",
            width: "100%",
          }}
        />
      </foreignObject>
      <path
        fill="url(#d)"
        d="M231 78c0-13.255 10.745-24 24-24h633c13.255 0 24 10.745 24 24v662c0 13.255-10.745 24-24 24H255c-13.255 0-24-10.745-24-24z"
      />
      <g filter="url(#e)">
        <path
          fill="#fff"
          d="M255 90c0-6.627 5.373-12 12-12h609c6.627 0 12 5.373 12 12v32c0 6.627-5.373 12-12 12H267c-6.627 0-12-5.373-12-12z"
          fillOpacity=".12"
          shapeRendering="crispEdges"
        />
        <path
          fill="#fff"
          d="M294.784 95.17c3.247 0 6.157 1.438 8.132 3.711l5.93-3.422 2.154 3.73-5.965 3.443c.336 1.043.52 2.154.52 3.308-.001 5.948-4.823 10.769-10.771 10.769a10.74 10.74 0 0 1-7.987-3.546l-5.643 3.258L279 112.69l5.604-3.236a10.7 10.7 0 0 1-.589-3.514c0-5.948 4.821-10.77 10.769-10.77m-4.111 15.755a6.462 6.462 0 0 0 10.483-6.053zm4.111-11.448a6.463 6.463 0 0 0-6.332 7.755l10.616-6.129a6.44 6.44 0 0 0-4.284-1.626m78.212 10.691q-1.536 0-2.436-.864-.9-.876-.9-2.52v-1.968q0-1.644.9-2.508.9-.876 2.436-.876 1.512 0 2.328.84.828.84.828 2.292v.072h-1.284v-.108q0-.852-.468-1.392-.456-.54-1.404-.54-.96 0-1.5.588-.54.576-.54 1.608v2.016q0 1.02.54 1.608t1.5.588q.948 0 1.404-.54.468-.552.468-1.392v-.204h1.284v.168q0 1.452-.828 2.292-.816.84-2.328.84m6.463 0q-.636 0-1.14-.216a1.9 1.9 0 0 1-.792-.636q-.288-.42-.288-1.02 0-.612.288-1.008.3-.408.804-.612a3.1 3.1 0 0 1 1.164-.204h1.8v-.384q0-.516-.312-.828t-.96-.312q-.636 0-.972.3t-.444.78l-1.152-.372q.144-.48.456-.864.324-.396.852-.636t1.272-.24q1.152 0 1.812.588t.66 1.668v2.436q0 .36.336.36h.504V110h-.924q-.42 0-.684-.216a.72.72 0 0 1-.264-.588v-.036h-.18q-.096.18-.288.42t-.564.42q-.372.168-.984.168m.18-1.02q.744 0 1.2-.42.456-.432.456-1.176v-.12h-1.728q-.492 0-.792.216-.3.204-.3.612t.312.648.852.24m4.91 3.252v-8.316h1.212v.852h.192q.228-.396.684-.708.468-.312 1.332-.312a2.63 2.63 0 0 1 2.352 1.404q.384.672.384 1.632v.18q0 .96-.372 1.644-.372.672-.996 1.032a2.7 2.7 0 0 1-1.368.36q-.576 0-.972-.144a1.9 1.9 0 0 1-.636-.36 2.3 2.3 0 0 1-.384-.468h-.192v3.204zm3.06-3.312q.816 0 1.332-.516t.516-1.476v-.108q0-.948-.528-1.464-.516-.516-1.32-.516-.792 0-1.32.516-.516.516-.516 1.464v.108q0 .96.516 1.476.528.516 1.32.516m6.625.912q-.54 0-.864-.324-.312-.324-.312-.864v-3.684h-1.632v-1.044h1.632v-1.956h1.236v1.956h1.764v1.044h-1.764v3.468q0 .36.336.36h1.236V110zm5.544.108q-.672 0-1.2-.3a2.1 2.1 0 0 1-.828-.852q-.3-.552-.3-1.32v-3.552h1.236v3.468q0 .768.384 1.14.384.36 1.068.36.756 0 1.212-.504.468-.516.468-1.476v-2.988h1.236V110h-1.212v-.888h-.192q-.168.36-.6.684-.432.312-1.272.312m5.103-.108v-5.916h1.212v.696h.192a1 1 0 0 1 .456-.54q.324-.18.792-.18h.708v1.116h-.756q-.6 0-.984.336-.384.324-.384 1.008V110zm7.141.168q-.9 0-1.572-.372a2.77 2.77 0 0 1-1.056-1.068q-.372-.696-.372-1.608v-.144q0-.924.372-1.608.372-.696 1.032-1.068.672-.384 1.548-.384.852 0 1.488.384.648.372 1.008 1.044t.36 1.572v.468h-4.548q.024.78.516 1.248.504.456 1.248.456.696 0 1.044-.312a2.2 2.2 0 0 0 .552-.72l1.02.528q-.168.336-.492.708a2.5 2.5 0 0 1-.828.624q-.516.252-1.32.252m-1.728-3.732h3.276q-.048-.672-.48-1.044-.432-.384-1.128-.384t-1.14.384q-.432.372-.528 1.044"
        />
        <path
          stroke="#fff"
          d="M428 106h12"
          strokeLinecap="round"
          strokeOpacity=".12"
          strokeWidth="4"
        />
        <path
          fill="#fff"
          d="M452.876 110v-8.4h1.296v7.224h4.044V110zm8.399.168q-.636 0-1.14-.216a1.9 1.9 0 0 1-.792-.636q-.288-.42-.288-1.02 0-.612.288-1.008.3-.408.804-.612a3.1 3.1 0 0 1 1.164-.204h1.8v-.384q0-.516-.312-.828t-.96-.312q-.636 0-.972.3t-.444.78l-1.152-.372q.144-.48.456-.864.324-.396.852-.636t1.272-.24q1.152 0 1.812.588t.66 1.668v2.436q0 .36.336.36h.504V110h-.924q-.42 0-.684-.216a.72.72 0 0 1-.264-.588v-.036h-.18q-.096.18-.288.42t-.564.42q-.372.168-.984.168m.18-1.02q.744 0 1.2-.42.456-.432.456-1.176v-.12h-1.728q-.492 0-.792.216-.3.204-.3.612t.312.648.852.24m8.33 1.02q-.864 0-1.332-.312a2.25 2.25 0 0 1-.684-.696h-.192v.84h-1.212v-8.4h1.236v3.288h.192q.144-.24.384-.456.24-.228.636-.372t.972-.144q.744 0 1.368.36t.996 1.044.372 1.632v.18q0 .96-.384 1.644a2.63 2.63 0 0 1-2.352 1.392m-.36-1.08q.804 0 1.32-.516.528-.516.528-1.476v-.108q0-.948-.516-1.464t-1.332-.516q-.792 0-1.32.516-.516.516-.516 1.464v.108q0 .96.516 1.476.528.516 1.32.516m7.34 1.08q-.9 0-1.572-.372a2.77 2.77 0 0 1-1.056-1.068q-.372-.696-.372-1.608v-.144q0-.924.372-1.608.372-.696 1.032-1.068.672-.384 1.548-.384.852 0 1.488.384.648.372 1.008 1.044t.36 1.572v.468h-4.548q.024.78.516 1.248.504.456 1.248.456.696 0 1.044-.312a2.2 2.2 0 0 0 .552-.72l1.02.528q-.168.336-.492.708a2.5 2.5 0 0 1-.828.624q-.516.252-1.32.252m-1.728-3.732h3.276q-.048-.672-.48-1.044-.432-.384-1.128-.384t-1.14.384q-.432.372-.528 1.044M481.06 110v-8.4h1.236v8.4z"
        />
        <path
          stroke="#fff"
          d="M496 106h12"
          strokeLinecap="round"
          strokeOpacity=".12"
          strokeWidth="4"
        />
        <path
          fill="#fff"
          d="M522.88 110v-7.224h-2.58V101.6h6.456v1.176h-2.58V110zm4.22 0v-5.916h1.212v.696h.192a1 1 0 0 1 .456-.54q.324-.18.792-.18h.708v1.116h-.756q-.6 0-.984.336-.384.324-.384 1.008V110zm6.312.168q-.636 0-1.14-.216a1.9 1.9 0 0 1-.792-.636q-.288-.42-.288-1.02 0-.612.288-1.008.3-.408.804-.612a3.1 3.1 0 0 1 1.164-.204h1.8v-.384q0-.516-.312-.828t-.96-.312q-.636 0-.972.3t-.444.78l-1.152-.372q.144-.48.456-.864.324-.396.852-.636t1.272-.24q1.152 0 1.812.588t.66 1.668v2.436q0 .36.336.36h.504V110h-.924q-.42 0-.684-.216a.72.72 0 0 1-.264-.588v-.036h-.18q-.096.18-.288.42t-.564.42q-.372.168-.984.168m.18-1.02q.744 0 1.2-.42.456-.432.456-1.176v-.12h-1.728q-.492 0-.792.216-.3.204-.3.612t.312.648.852.24m4.91.852v-5.916h1.236V110zm.624-6.72a.88.88 0 0 1-.612-.228.83.83 0 0 1-.24-.612.8.8 0 0 1 .24-.6.86.86 0 0 1 .612-.24q.372 0 .612.24a.8.8 0 0 1 .24.6q0 .372-.24.612a.85.85 0 0 1-.612.228m2.446 6.72v-5.916h1.212v.888h.192q.168-.36.6-.672t1.284-.312q.672 0 1.188.3.528.3.828.852.3.54.3 1.308V110h-1.236v-3.456q0-.768-.384-1.128-.384-.372-1.056-.372-.768 0-1.236.504-.456.504-.456 1.464V110z"
        />
        <path
          stroke="#fff"
          d="M561 106h12"
          strokeLinecap="round"
          strokeOpacity=".12"
          strokeWidth="4"
        />
        <path
          fill="#fff"
          d="M585.876 110v-8.4h3.528q.78 0 1.368.276.6.264.924.768.336.504.336 1.2v.132q0 .792-.384 1.272a2 2 0 0 1-.912.66v.192q.456.024.732.312.276.276.276.804V110h-1.308v-2.604q0-.324-.168-.516t-.54-.192h-2.556V110zm1.296-4.488h2.088q.696 0 1.08-.348.384-.36.384-.972v-.096q0-.612-.384-.96-.372-.36-1.08-.36h-2.088zm8.59 4.596q-.672 0-1.2-.3a2.1 2.1 0 0 1-.828-.852q-.3-.552-.3-1.32v-3.552h1.236v3.468q0 .768.384 1.14.384.36 1.068.36.756 0 1.212-.504.468-.516.468-1.476v-2.988h1.236V110h-1.212v-.888h-.192q-.168.36-.6.684-.432.312-1.272.312m5.103-.108v-5.916h1.212v.888h.192q.168-.36.6-.672t1.284-.312q.672 0 1.188.3.528.3.828.852.3.54.3 1.308V110h-1.236v-3.456q0-.768-.384-1.128-.384-.372-1.056-.372-.768 0-1.236.504-.456.504-.456 1.464V110z"
        />
      </g>
      <g fill="#fff">
        <g opacity=".2">
          <path
            d="M255 162c0-6.627 5.373-12 12-12h41c6.627 0 12 5.373 12 12v26.844c0 6.628-5.373 12-12 12h-41c-6.627 0-12-5.372-12-12z"
            fillOpacity=".38"
          />
          <path
            d="M279.333 162.099c0-2.262-1.829-4.099-4.083-4.099s-4.083 1.837-4.083 4.099 1.829 4.1 4.083 4.1 4.083-1.837 4.083-4.1m-1.477 15.461a2 2 0 0 0-3.198-.021l-9.211 12.094c-1.003 1.316-.064 3.211 1.591 3.211h41.034c1.635 0 2.579-1.854 1.618-3.176l-14.536-19.987a2 2 0 0 0-3.224-.014l-8.353 11.274a2 2 0 0 1-3.213 0z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </g>
        <g opacity=".3">
          <path
            d="M255 220.844c0-6.627 5.373-12 12-12h41c6.627 0 12 5.373 12 12v26.845c0 6.627-5.373 12-12 12h-41c-6.627 0-12-5.373-12-12z"
            fillOpacity=".38"
          />
          <path
            d="M279.333 220.944c0-2.263-1.829-4.1-4.083-4.1s-4.083 1.837-4.083 4.1a4.09 4.09 0 0 0 4.083 4.099 4.09 4.09 0 0 0 4.083-4.099m-1.477 15.46a2 2 0 0 0-3.198-.021l-9.211 12.094c-1.003 1.317-.064 3.212 1.591 3.212h41.034c1.635 0 2.579-1.854 1.618-3.176l-14.536-19.987a2 2 0 0 0-3.224-.015l-8.353 11.274a2 2 0 0 1-3.213.001z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </g>
        <g filter="url(#f)">
          <path
            d="M255 279.689c0-6.627 5.373-12 12-12h41c6.627 0 12 5.373 12 12v26.844c0 6.628-5.373 12-12 12h-41c-6.627 0-12-5.372-12-12z"
            fillOpacity=".38"
            shapeRendering="crispEdges"
          />
          <path
            d="M279.333 279.788a4.09 4.09 0 0 0-4.083-4.099 4.09 4.09 0 0 0-4.083 4.099c0 2.263 1.829 4.1 4.083 4.1s4.083-1.837 4.083-4.1m-1.477 15.46a2 2 0 0 0-3.198-.02l-9.211 12.094c-1.003 1.316-.064 3.211 1.591 3.211h41.034c1.635 0 2.579-1.854 1.618-3.176l-14.536-19.987a2 2 0 0 0-3.224-.014l-8.353 11.273a2 2 0 0 1-3.213.001z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </g>
        <g opacity=".4">
          <path
            d="M255 338.533c0-6.627 5.373-12 12-12h41c6.627 0 12 5.373 12 12v26.845c0 6.627-5.373 12-12 12h-41c-6.627 0-12-5.373-12-12z"
            fillOpacity=".38"
          />
          <path
            d="M279.333 338.633c0-2.263-1.829-4.1-4.083-4.1s-4.083 1.837-4.083 4.1 1.829 4.099 4.083 4.099 4.083-1.837 4.083-4.099m-1.477 15.46a2 2 0 0 0-3.198-.021l-9.211 12.094c-1.003 1.316-.064 3.212 1.591 3.212h41.034c1.635 0 2.579-1.855 1.618-3.177l-14.536-19.987a2 2 0 0 0-3.224-.014l-8.353 11.274a2 2 0 0 1-3.213 0z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </g>
        <g opacity=".2">
          <path
            d="M255 397.378c0-6.628 5.373-12 12-12h41c6.627 0 12 5.372 12 12v26.844c0 6.628-5.373 12-12 12h-41c-6.627 0-12-5.372-12-12z"
            fillOpacity=".38"
          />
          <path
            d="M279.333 397.477a4.09 4.09 0 0 0-4.083-4.099 4.09 4.09 0 0 0-4.083 4.099 4.09 4.09 0 0 0 4.083 4.099 4.09 4.09 0 0 0 4.083-4.099m-1.477 15.46a2 2 0 0 0-3.198-.02l-9.211 12.093c-1.003 1.317-.064 3.212 1.591 3.212h41.034c1.635 0 2.579-1.854 1.618-3.176l-14.536-19.987a2 2 0 0 0-3.224-.014l-8.353 11.273a2 2 0 0 1-3.213.001z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </g>
        <g opacity=".08">
          <path
            d="M255 456.222c0-6.627 5.373-12 12-12h41c6.627 0 12 5.373 12 12v26.845c0 6.627-5.373 12-12 12h-41c-6.627 0-12-5.373-12-12z"
            fillOpacity=".38"
          />
          <path
            d="M279.333 456.322c0-2.263-1.829-4.1-4.083-4.1s-4.083 1.837-4.083 4.1 1.829 4.099 4.083 4.099 4.083-1.837 4.083-4.099m-1.477 15.46a2 2 0 0 0-3.198-.021l-9.211 12.094c-1.003 1.316-.064 3.212 1.591 3.212h41.034c1.635 0 2.579-1.855 1.618-3.177l-14.536-19.987a2 2 0 0 0-3.224-.014l-8.353 11.274a2 2 0 0 1-3.213 0z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </g>
      </g>
      <g filter="url(#g)">
        <path
          fill="url(#h)"
          d="M340 162c0-6.627 5.373-12 12-12h96c6.627 0 12 5.373 12 12v387c0 6.627-5.373 12-12 12h-96c-6.627 0-12-5.373-12-12z"
          shapeRendering="crispEdges"
        />
        <g filter="url(#i)">
          <rect
            width="40"
            height="4"
            x="356"
            y="166"
            fill="#fff"
            fillOpacity=".38"
            rx="2"
            shapeRendering="crispEdges"
          />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="186" r="4" />
          <rect width="74" height="6" x="370" y="183" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="202" r="4" />
          <rect width="74" height="6" x="370" y="199" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="218" r="4" />
          <rect width="74" height="6" x="370" y="215" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="234" r="4" />
          <rect width="74" height="6" x="370" y="231" rx="3" />
        </g>
        <g filter="url(#j)">
          <rect
            width="40"
            height="4"
            x="356"
            y="258"
            fill="#fff"
            fillOpacity=".38"
            rx="2"
            shapeRendering="crispEdges"
          />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="278" r="4" />
          <rect width="74" height="6" x="370" y="275" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="294" r="4" />
          <rect width="74" height="6" x="370" y="291" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="310" r="4" />
          <rect width="74" height="6" x="370" y="307" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="326" r="4" />
          <rect width="74" height="6" x="370" y="323" rx="3" />
        </g>
        <g fill="#fff" fillOpacity=".12">
          <circle cx="360" cy="342" r="4" />
          <rect width="74" height="6" x="370" y="339" rx="3" />
        </g>
      </g>
      <g filter="url(#k)">
        <path
          fill="url(#l)"
          d="M480 162c0-6.627 5.373-12 12-12h384c6.627 0 12 5.373 12 12v387c0 6.627-5.373 12-12 12H492c-6.627 0-12-5.373-12-12z"
          shapeRendering="crispEdges"
        />
        <rect
          width="40"
          height="4"
          x="496"
          y="166"
          fill="#fff"
          fillOpacity=".38"
          rx="2"
        />
        <g filter="url(#m)">
          <path
            fill="#fff"
            d="M584 481c0-6.627 5.373-12 12-12h176c6.627 0 12 5.373 12 12v12c0 6.627-5.373 12-12 12H596c-6.627 0-12-5.373-12-12z"
            fillOpacity=".05"
            shapeRendering="crispEdges"
          />
          <path
            fill="#00EBCF"
            d="M592 485a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8h-24a8 8 0 0 1-8-8z"
            fillOpacity=".15"
          />
          <path fill="#00E2C8" d="M596 485a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z" />
          <g opacity=".6">
            <path
              fill="#FE68BE"
              d="M640 485a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8h-24a8 8 0 0 1-8-8z"
              fillOpacity=".15"
            />
            <path fill="#F93BA3" d="M644 485a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z" />
          </g>
          <g opacity=".6">
            <path
              fill="#5989FF"
              d="M688 485a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8h-24a8 8 0 0 1-8-8z"
              fillOpacity=".15"
            />
            <path fill="#2756FF" d="M692 485a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z" />
          </g>
          <g opacity=".6">
            <path
              fill="#DCE91D"
              d="M736 485a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8h-24a8 8 0 0 1-8-8z"
              fillOpacity=".15"
            />
            <path fill="#D6DA18" d="M740 485a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z" />
          </g>
        </g>
      </g>
      <defs>
        <filter
          id="e"
          width="657"
          height="80"
          x="243"
          y="68"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <filter
          id="f"
          width="89"
          height="74.844"
          x="243"
          y="257.689"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <filter
          id="g"
          width="144"
          height="435"
          x="328"
          y="140"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <filter
          id="i"
          width="64"
          height="28"
          x="344"
          y="156"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <filter
          id="j"
          width="64"
          height="28"
          x="344"
          y="248"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <filter
          id="k"
          width="432"
          height="435"
          x="468"
          y="140"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <filter
          id="m"
          width="224"
          height="60"
          x="572"
          y="459"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset dy="2" />
          <feGaussianBlur stdDeviation="6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.12 0" />
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_1526_28308"
          />
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_1526_28308"
            result="shape"
          />
        </filter>
        <linearGradient
          id="a"
          x1="262.5"
          x2="262.5"
          y1="108"
          y2="360"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#43C47D" />
          <stop offset="1" stopColor="#205E3C" />
        </linearGradient>
        <linearGradient
          id="b"
          x1="101"
          x2="262.5"
          y1="108"
          y2="360"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#20A963" />
          <stop offset="1" stopColor="#0D4327" />
        </linearGradient>
        <linearGradient
          id="d"
          x1="571.5"
          x2="571.5"
          y1="54"
          y2="764"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset=".577" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".577" stopColor="#fff" stopOpacity=".05" />
          <stop offset=".846" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="h"
          x1="400"
          x2="400"
          y1="150"
          y2="561"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient
          id="l"
          x1="684"
          x2="684"
          y1="150"
          y2="561"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="c" transform="translate(-199 -22)">
          <path d="M231 78c0-13.255 10.745-24 24-24h633c13.255 0 24 10.745 24 24v662c0 13.255-10.745 24-24 24H255c-13.255 0-24-10.745-24-24z" />
        </clipPath>
      </defs>
    </svg>
  );
};
