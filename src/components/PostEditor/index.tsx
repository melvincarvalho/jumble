import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { useScreenSize } from '@/providers/ScreenSizeProvider'
import { Event } from 'nostr-tools'
import { Dispatch, useMemo } from 'react'
import PostContent from './PostContent'
import Title from './Title'

export default function PostEditor({
  defaultContent = '',
  parentEvent,
  open,
  setOpen
}: {
  defaultContent?: string
  parentEvent?: Event
  open: boolean
  setOpen: Dispatch<boolean>
}) {
  const { isSmallScreen } = useScreenSize()

  const content = useMemo(() => {
    return (
      <PostContent
        defaultContent={defaultContent}
        parentEvent={parentEvent}
        close={() => setOpen(false)}
      />
    )
  }, [])

  if (isSmallScreen) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="h-full w-full p-0 border-none" side="bottom" hideClose>
          <ScrollArea className="px-4 h-full max-h-screen">
            <div className="space-y-4 px-2 py-6">
              <SheetHeader>
                <SheetTitle className="text-start">
                  <Title parentEvent={parentEvent} />
                </SheetTitle>
                <SheetDescription className="hidden" />
              </SheetHeader>
              {content}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl" withoutClose>
        <ScrollArea className="px-4 h-full max-h-screen">
          <div className="space-y-4 px-2 py-6">
            <DialogHeader>
              <DialogTitle>
                <Title parentEvent={parentEvent} />
              </DialogTitle>
              <DialogDescription className="hidden" />
            </DialogHeader>
            {content}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
