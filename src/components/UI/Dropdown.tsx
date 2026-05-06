import { useState, useRef, type ReactNode } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  alpha,
  ButtonBase,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Check as CheckIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { FONT_SIZES } from '@/constants';
import { useTranslation } from 'react-i18next';

export interface DropdownOption {
  id: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  category?: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  renderSearch?: ReactNode;
  maxHeight?: number;
  showIcons?: boolean;
  startIcon?: ReactNode;
}

const Dropdown = ({
  options,
  value,
  onChange,
  renderSearch,
  maxHeight = 380,
  showIcons = false,
  startIcon,
}: DropdownProps) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  const checkPosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < maxHeight && rect.top > maxHeight);
    }
  };

  const handleToggle = () => {
    if (!isOpen) checkPosition();
    setIsOpen(!isOpen);
  };

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  const categories = Array.from(
    new Set(options.map((opt) => opt.category).filter(Boolean)),
  ) as string[];

  const renderOption = (opt: DropdownOption) => {
    const isSelected = opt.id === value;
    return (
      <ListItemButton
        key={opt.id}
        data-testid={`dropdown-option-${opt.id}`}
        onClick={() => handleSelect(opt.id)}
        sx={{
          py: 1.5,
          px: 2,
          bgcolor: isSelected ? 'primary.50' : 'transparent',
          '&:hover': { bgcolor: isSelected ? 'primary.50' : 'action.hover' },
        }}
      >
        {showIcons && opt.icon && (
          <ListItemIcon sx={{ minWidth: 40, color: isSelected ? 'primary.600' : 'neutral.500' }}>
            {opt.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
              }}
            >
              <Typography
                sx={{
                  fontSize: FONT_SIZES.md,
                  fontWeight: isSelected ? 'fontWeightSemiBold' : 'fontWeightRegular',
                  color: isSelected ? 'primary.500' : 'neutral.900',
                }}
              >
                {opt.title}
              </Typography>
              {opt.rightElement}
            </Box>
          }
          secondary={
            opt.description && (
              <Typography
                sx={{ fontSize: FONT_SIZES.xs, color: isSelected ? 'neutral.700' : 'neutral.400' }}
              >
                {opt.description}
              </Typography>
            )
          }
        />
        {isSelected && !opt.rightElement && (
          <CheckIcon sx={{ color: 'primary.600', fontSize: FONT_SIZES.lg }} />
        )}
      </ListItemButton>
    );
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%' }}>
      <ButtonBase
        data-testid="dropdown-toggle"
        onClick={handleToggle}
        sx={{
          width: '100%',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          border: '1px solid',
          borderColor: isOpen ? 'primary.500' : 'divider',
          borderRadius: '8px',
          bgcolor: 'common.white',
          zIndex: 12,
          transition: 'all 0.2s ease',
          '&:hover': { borderColor: 'primary.500' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, textAlign: 'left' }}>
          {(startIcon || (showIcons && selectedOption?.icon)) && (
            <Box sx={{ color: 'neutral.400', display: 'flex' }}>
              {startIcon || selectedOption?.icon}
            </Box>
          )}
          <Box>
            <Typography sx={{ fontWeight: 'fontWeightSemiBold', color: 'neutral.800' }}>
              {selectedOption?.title || t('deIdentify.languageSelect.placeholder')}
            </Typography>
            {selectedOption?.description && (
              <Typography sx={{ fontSize: FONT_SIZES.xs, color: 'neutral.400', mt: 0.5 }}>
                {selectedOption.description}
              </Typography>
            )}
          </Box>
        </Box>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ExpandMoreIcon sx={{ color: 'neutral.400' }} />
        </motion.div>
      </ButtonBase>

      <AnimatePresence>
        {isOpen && (
          <>
            <Box
              onClick={() => setIsOpen(false)}
              sx={{ position: 'fixed', inset: 0, zIndex: 10, bgcolor: 'transparent' }}
            />

            <Box
              component={motion.div}
              initial={{ opacity: 0, y: dropUp ? 10 : -10, scale: 0.98 }}
              animate={{ opacity: 1, y: dropUp ? -4 : 4, scale: 1 }}
              exit={{ opacity: 0, y: dropUp ? 10 : -10, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              sx={{
                position: 'absolute',
                [dropUp ? 'bottom' : 'top']: '100%',
                left: 0,
                right: 0,
                zIndex: 11,
                bgcolor: 'common.white',
                borderRadius: '8px',
                boxShadow: (theme) => `0px 10px 30px ${alpha(theme.palette.common.black, 0.15)}`,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                maxHeight: maxHeight,
                display: 'flex',
                flexDirection: 'column',
                transformOrigin: dropUp ? 'bottom' : 'top',
              }}
            >
              {renderSearch}

              <Box sx={{ overflowY: 'auto', flexGrow: 1 }} className="scrollbar-md">
                {categories.length > 0 ? (
                  categories.map((cat) => (
                    <Box key={cat}>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.8,
                          bgcolor: 'neutral.50',
                          borderY: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: FONT_SIZES.xs,
                            fontWeight: 'fontWeightBold',
                            color: 'neutral.400',
                            textTransform: 'uppercase',
                          }}
                        >
                          {cat}
                        </Typography>
                      </Box>
                      <List sx={{ p: 0 }}>
                        {options.filter((opt) => opt.category === cat).map(renderOption)}
                      </List>
                    </Box>
                  ))
                ) : (
                  <List sx={{ p: 0 }}>{options.map(renderOption)}</List>
                )}

                {options.length === 0 && (
                  <Typography
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      color: 'neutral.400',
                      fontSize: FONT_SIZES.sm,
                    }}
                  >
                    {t('deIdentify.languageSelect.noLanguages')}
                  </Typography>
                )}
              </Box>
            </Box>
          </>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default Dropdown;
