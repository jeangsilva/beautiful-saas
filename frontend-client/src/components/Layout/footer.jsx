/**
 * Beautiful SaaS - Footer Component
 * Footer com links e informações da empresa
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  Twitter,
  Heart,
  Calendar,
  Clock
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const companyInfo = {
    name: 'Beautiful',
    description: 'Conectando você aos melhores profissionais de beleza da sua região.',
    address: 'Rua da Beleza, 123 - Centro, São Paulo - SP',
    phone: '+55 (11) 99999-9999',
    email: 'contato@beautiful.com.br',
    hours: 'Seg - Sex: 9h às 18h | Sáb: 9h às 17h'
  };

  const footerLinks = [
    {
      title: 'Serviços',
      links: [
        { name: 'Corte de Cabelo', href: '/servicos?categoria=cabelo' },
        { name: 'Manicure & Pedicure', href: '/servicos?categoria=unhas' },
        { name: 'Tratamentos Faciais', href: '/servicos?categoria=estetica' },
        { name: 'Massagem', href: '/servicos?categoria=bem-estar' },
        { name: 'Todos os Serviços', href: '/servicos' },
      ]
    },
    {
      title: 'Empresa',
      links: [
        { name: 'Sobre Nós', href: '/sobre' },
        { name: 'Como Funciona', href: '/sobre#como-funciona' },
        { name: 'Nossos Parceiros', href: '/sobre#parceiros' },
        { name: 'Trabalhe Conosco', href: '/contato?tipo=trabalhe-conosco' },
        { name: 'Imprensa', href: '/contato?tipo=imprensa' },
      ]
    },
    {
      title: 'Suporte',
      links: [
        { name: 'Central de Ajuda', href: '/contato' },
        { name: 'Como Agendar', href: '/contato#ajuda' },
        { name: 'Cancelamentos', href: '/contato#cancelamentos' },
        { name: 'Reagendamentos', href: '/contato#reagendamentos' },
        { name: 'Contato', href: '/contato' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { name: 'Política de Privacidade', href: '/privacidade' },
        { name: 'Termos de Uso', href: '/privacidade#termos' },
        { name: 'Política de Cookies', href: '/privacidade#cookies' },
        { name: 'LGPD', href: '/privacidade#lgpd' },
      ]
    }
  ];

  const socialLinks = [
    {
      name: 'Instagram',
      href: 'https://instagram.com/beautiful',
      icon: Instagram,
      color: 'hover:text-pink-500'
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com/beautiful',
      icon: Facebook,
      color: 'hover:text-blue-600'
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/beautiful',
      icon: Twitter,
      color: 'hover:text-blue-400'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Company Info */}
          <motion.div 
            className="lg:col-span-2"
            variants={itemVariants}
          >
            <Link 
              to="/" 
              className="flex items-center space-x-3 mb-6 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="font-display font-bold text-2xl">
                Beautiful
              </span>
            </Link>

            <p className="text-gray-300 mb-6 leading-relaxed">
              {companyInfo.description}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {companyInfo.address}
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a 
                  href={`tel:${companyInfo.phone.replace(/\s/g, '')}`}
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  {companyInfo.phone}
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <a 
                  href={`mailto:${companyInfo.email}`}
                  className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                >
                  {companyInfo.email}
                </a>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary-400 flex-shrink-0" />
                <span className="text-gray-300 text-sm">
                  {companyInfo.hours}
                </span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 bg-gray-800 rounded-lg text-gray-400 transition-all duration-200 hover:bg-gray-700 ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Footer Links */}
          {footerLinks.map((section, index) => (
            <motion.div 
              key={section.title}
              variants={itemVariants}
            >
              <h3 className="font-semibold text-white mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200 text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <motion.div 
          className="mt-12 pt-8 border-t border-gray-800"
          variants={itemVariants}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                Fique por dentro das novidades
              </h3>
              <p className="text-gray-300">
                Receba dicas de beleza, promoções exclusivas e novidades em primeira mão.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="Seu melhor e-mail"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors duration-200"
              />
              <button className="btn-gradient px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap">
                Inscrever-se
              </button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <motion.div 
          className="mt-12 pt-8 border-t border-gray-800 flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0"
          variants={itemVariants}
        >
          <div className="flex items-center space-x-1 text-gray-300 text-sm">
            <span>© {currentYear} Beautiful. Feito com</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>para a comunidade de beleza.</span>
          </div>

          <div className="flex items-center space-x-6">
            <Link 
              to="/agendar"
              className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors duration-200 text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              <span>Agendar Serviço</span>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;