import React from 'react';
import { BookOpen, Github, Mail, Heart, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <BookOpen className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">CSE Resources</span>
            </div>
            <p className="text-gray-300 max-w-md">
              A collaborative platform for CSE students to share and access academic resources across all semesters. 
              Built by students, for students.
            </p>
          </div>
          
           
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4 mb-4">
               
              <a href="mailto:info@agadiengcollege.com" className="text-gray-300 hover:text-white transition-colors">
                <Mail className="h-6 w-6" />
              </a>
              <a href="https://www.linkedin.com/groups/12373563" target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white transition-colors">
                <Linkedin className="h-6 w-6" />
              </a>
            </div>
            <div className="text-gray-300 space-y-1">
              <p><strong>Phone:</strong> <a href="tel:+91 8095791205" className="hover:text-white">+91 80957 91205</a></p>
              <p><strong>Email:</strong> <a href="mailto:info@agadiengcollege.com" className="hover:text-white">info@agadiengcollege.com</a></p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex items-center justify-center">
          <p className="text-gray-300 flex items-center">
            Made with <Heart className="h-4 w-4 text-red-500 mx-1" /> for CSE students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
