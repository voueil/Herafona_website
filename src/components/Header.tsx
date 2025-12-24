import { useState } from 'react';
import { Button } from './ui/button';
import type { PageString } from "../App";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Calendar, LogOut } from 'lucide-react';
import coloredLogo from "../assets/logo-color.png";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  userAvatar?: string;
onNavigate?: (page: PageString) => void
  onLogout?: () => void;
  language?: 'ar' | 'en';
  onLanguageToggle?: () => void;
}

export function Header({ isLoggedIn = false, userName, userAvatar, onNavigate, onLogout, language = 'ar', onLanguageToggle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto max-w-[1440px] px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => onNavigate?.('home')}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img src={coloredLogo} alt="Herafona" className="h-12 w-auto" />

          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-10">
            <button
              onClick={() => onNavigate?.('home')}
              className="hover:text-[#3F2A22] transition-colors"
            >
              {language === 'ar' ? 'الصفحة الرئيسية' : 'Home'}
            </button>
            <button
              onClick={() => onNavigate?.('events')}
              className="hover:text-[#3F2A22] transition-colors"
            >
              {language === 'ar' ? 'الفعاليات' : 'Events'}
            </button>
            <button
              onClick={() => onNavigate?.('assistant')}
              className="hover:text-[#3F2A22] transition-colors"
            >
              {language === 'ar' ? 'مساعد حِرفُنا' : 'Herafona Assistant'}
            </button>
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userAvatar} />
                      <AvatarFallback className="bg-[#15442f] text-white">
                        {userName?.[0] || 'م'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  <DropdownMenuItem onClick={() => onNavigate?.('profile')}>
                    <User className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {language === 'ar' ? 'الحساب الشخصي' : 'Profile'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate?.('reservations')}>
                    <Calendar className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {language === 'ar' ? 'الحجوزات' : 'Reservations'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout}>
                    <LogOut className={`${language === 'ar' ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                    {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <button
                onClick={() => onNavigate?.('login')}
                className="animated-login-button bg-[#15442f] text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-shadow"
              >
                <span className="bubble"></span>
                <span className="bubble"></span>
                <span className="bubble"></span>
                <span className="bubble"></span>
                <span className="bubble"></span>
                <span className="button-text">{language === 'ar' ? 'تسجيل الدخول' : 'Login'}</span>
              </button>
            )}
            <Button
              onClick={onLanguageToggle}
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 hover:bg-secondary"
            >
              {language === 'ar' ? 'EN' : 'ع'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}