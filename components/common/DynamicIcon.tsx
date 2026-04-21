import React from 'react'

import * as AiIcons from 'react-icons/ai';  // Ant Design Icons
import * as BsIcons from 'react-icons/bs';  // Bootstrap Icons
import * as BiIcons from 'react-icons/bi';  // BoxIcons
import * as CiIcons from 'react-icons/ci';  // Circum Icons
import * as DiIcons from 'react-icons/di';  // Devicons
import * as FaIcons from 'react-icons/fa';  // Font Awesome
import * as FcIcons from 'react-icons/fc';  // Flat Color Icons
import * as FiIcons from 'react-icons/fi';  // Feather Icons
import * as GiIcons from 'react-icons/gi';  // Game Icons
import * as GoIcons from 'react-icons/go';  // GitHub Octicons
import * as GrIcons from 'react-icons/gr';  // Grommet-Icons
import * as HiIcons from 'react-icons/hi';  // Heroicons (outline)
import * as ImIcons from 'react-icons/im';  // IcoMoon Free
import * as IoIcons from 'react-icons/io';  // Ionicons 4
import * as Io5Icons from 'react-icons/io5'; // Ionicons 5
import * as LuIcons from 'react-icons/lu';  // Lucide Icons
import * as MdIcons from 'react-icons/md';  // Material Design
import * as PiIcons from 'react-icons/pi';  // Phosphor Icons
import * as RiIcons from 'react-icons/ri';  // Remix Icons
import * as RxIcons from 'react-icons/rx';  // Radix Icons
import * as SiIcons from 'react-icons/si';  // Simple Icons
import * as SlIcons from 'react-icons/sl';  // Simple Line Icons
import * as TbIcons from 'react-icons/tb';  // Tabler Icons
import * as TfiIcons from 'react-icons/tfi'; // Themify Icons
import * as TiIcons from 'react-icons/ti';  // Typicons
import * as VscIcons from 'react-icons/vsc'; // VS Code Icons
import * as CgIcons from 'react-icons/cg';  // CSS.gg

// Merge all into one map
const iconMap = {
  ...AiIcons,
  ...BsIcons,
  ...BiIcons,
  ...CiIcons,
  ...DiIcons,
  ...FaIcons,
  ...FcIcons,
  ...FiIcons,
  ...GiIcons,
  ...GoIcons,
  ...GrIcons,
  ...HiIcons,
  ...ImIcons,
  ...IoIcons,
  ...Io5Icons,
  ...LuIcons,
  ...MdIcons,
  ...PiIcons,
  ...RiIcons,
  ...RxIcons,
  ...SiIcons,
  ...SlIcons,
  ...TbIcons,
  ...TfiIcons,
  ...TiIcons,
  ...VscIcons,
  ...CgIcons,
};

export default function DynamicIcon({iconName, size, className}:{iconName: string, size?: number, className?: string}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-expect-error
    const IconComponent = iconMap[iconName]; // Replace with the desired icon name
   
  return (
    <>
    {IconComponent ? <IconComponent size={size} className={className} /> : <div>Icon not found</div>}
    </>
  )
}
