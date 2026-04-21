import * as React from "react"
import { ChevronDown } from "lucide-react"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, onValueChange, value, ...props }, ref) => {
    return (
      <div className="relative group/select">
        <select
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={`
            w-full bg-transparent border-none p-0 text-[10px] font-black uppercase tracking-[0.2em] focus:ring-0 focus:outline-none appearance-none cursor-pointer text-[#000000]
            ${className}
          `}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="absolute -right-4 top-1/2 -translate-y-1/2 h-3 w-3 opacity-30 group-hover/select:opacity-100 transition-opacity pointer-events-none" />
      </div>
    )
  }
)
Select.displayName = "Select"

const SelectTrigger = ({ children }: any) => <>{children}</>
const SelectValue = ({ placeholder }: any) => <>{placeholder}</>
const SelectContent = ({ children }: any) => <>{children}</>
const SelectItem = ({ children, value }: any) => <option value={value} className="bg-white text-black py-2">{children}</option>

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
