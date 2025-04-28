import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

const PoweredByAlte = () => {

  return (
        <Link href={'https://alteworkshop.com'} target='_blank' className='w-full flex justify-center items-baseline py-2 gap-1 text-copy'>
        <h6 className='text-sm tracking-wide'>Powered by </h6>
        <Image src={'/alteLogo.png'} className={`invert`} width={35} height={35} alt='Alte Workshop - Desarrollo de software'/>
        </Link>
  )
}

export default PoweredByAlte